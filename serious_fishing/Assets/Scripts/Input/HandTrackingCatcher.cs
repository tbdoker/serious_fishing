using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Mediapipe.Tasks.Vision.HandLandmarker;
using Mediapipe.Unity;

public class HandTrackingCatcher : MonoBehaviour
{
    [Header("Hand Tracking Settings")]
    [SerializeField] private bool useHandTracking = true;
    [SerializeField] private int handIndexToUse = 0; // 0 = first detected hand
    [SerializeField] [Range(0f, 10f)] private float movementSensitivity = 1.5f; // Hand movement speed multiplier

    [Header("Hand Skeleton")]
    [SerializeField] private bool showHandSkeleton = true; // Toggle hand skeleton on/off
    [SerializeField] private bool normalizeHandSize = true; // Keep hand same size regardless of distance
    [SerializeField] [Range(0f, 100f)] private float handSize = 5f; // Target hand size (wrist to middle finger)
    [SerializeField] private float jointSize = 7f; // Size of joint circles
    [SerializeField] private float lineWidth = 1f; // Width of bone lines
    [SerializeField] private Color handOpenColor = Color.white; // Hand skeleton color when open
    [SerializeField] private Color handClosedColor = Color.green; // Hand skeleton color when grabbing

    [Header("Grab Cursor")]
    [SerializeField] private bool showGrabCursor = true; // Toggle grab cursor on/off
    [SerializeField] [Range(1f, 100f)] private float cursorSize = 3f; // Size of the grab cursor (also used as catch radius)
    [SerializeField] private Color cursorOpenColor = Color.yellow; // Cursor color when hand is open
    [SerializeField] private Color cursorClosedColor = Color.green; // Cursor color when grabbing

    [Header("Grab Detection")]
    [SerializeField] [Range(0f, 1f)] private float grabThreshold = 0.6f; // How closed the hand needs to be (0-1)
    [SerializeField] private float catchCooldown = 0f; // Prevent double catches

    // Catch radius matches cursor size
    private float catchRadius => cursorSize;

    private GameObject handVisualization;
    private GameObject[] jointObjects;
    private LineRenderer[] boneLines;
    private GameObject grabCursor;
    private SpriteRenderer grabCursorRenderer;
    private Vector2 palmWorldPos; // Palm center position for grabbing
    private Vector3[] currentWorldPositions = new Vector3[21];
    private bool handDetected = false;
    private bool handEverDetected = false;
    private bool isGrabbing = false;
    private bool wasGrabbing = false; // For detecting grab moment
    private bool canGrab = false; // Must see open hand before allowing grab
    private float lastCatchTime = 0f;
    private Camera mainCamera;

    // Reference to MediaPipe hand landmarker result
    private HandLandmarkerResult currentResult;

    // Thread-safe: store pending result from callback thread
    private HandLandmarkerResult pendingResult;
    private bool hasPendingResult = false;
    private readonly object resultLock = new object();

    // MediaPipe landmark indices
    private const int WRIST = 0;
    private const int THUMB_TIP = 4;
    private const int INDEX_TIP = 8;
    private const int MIDDLE_TIP = 12;
    private const int RING_TIP = 16;
    private const int PINKY_TIP = 20;
    private const int INDEX_MCP = 5;
    private const int MIDDLE_MCP = 9;
    private const int RING_MCP = 13;
    private const int PINKY_MCP = 17;

    // MediaPipe hand landmark connections (21 landmarks, bones between them)
    private static readonly int[,] HAND_CONNECTIONS = new int[,]
    {
        // Palm
        {0, 1}, {1, 2}, {2, 3}, {3, 4},      // Thumb
        {0, 5}, {5, 6}, {6, 7}, {7, 8},      // Index finger
        {0, 9}, {9, 10}, {10, 11}, {11, 12}, // Middle finger
        {0, 13}, {13, 14}, {14, 15}, {15, 16}, // Ring finger
        {0, 17}, {17, 18}, {18, 19}, {19, 20}, // Pinky
        {5, 9}, {9, 13}, {13, 17}, {0, 17}   // Palm connections
    };

    void Start()
    {
        mainCamera = Camera.main;
        Debug.Log($"[HandTrackingCatcher] Start - Camera: {mainCamera?.name ?? "NULL"}");

        CreateHandVisualization();
    }

    void CreateHandVisualization()
    {
        // Parent object for all hand visualization
        handVisualization = new GameObject("HandVisualization");
        handVisualization.SetActive(false);

        // Create 21 joint circles
        jointObjects = new GameObject[21];
        for (int i = 0; i < 21; i++)
        {
            jointObjects[i] = CreateJointCircle(i);
            jointObjects[i].transform.SetParent(handVisualization.transform);
        }

        // Create bone lines (24 connections)
        int numConnections = HAND_CONNECTIONS.GetLength(0);
        boneLines = new LineRenderer[numConnections];
        for (int i = 0; i < numConnections; i++)
        {
            boneLines[i] = CreateBoneLine(i);
            boneLines[i].transform.SetParent(handVisualization.transform);
        }

        // Create grab cursor SEPARATELY (not parented) so it's always controllable
        grabCursor = CreateGrabCursor();
        // Don't parent to handVisualization - keep independent
        grabCursor.SetActive(false); // Start hidden, show when hand detected

        Debug.Log($"[HandTrackingCatcher] Created hand visualization with grab detection");
    }

    GameObject CreateJointCircle(int index)
    {
        GameObject joint = new GameObject($"Joint_{index}");
        SpriteRenderer sr = joint.AddComponent<SpriteRenderer>();

        // Create circle texture
        Texture2D tex = new Texture2D(32, 32);
        Color[] colors = new Color[32 * 32];
        for (int y = 0; y < 32; y++)
        {
            for (int x = 0; x < 32; x++)
            {
                float dist = Vector2.Distance(new Vector2(x, y), new Vector2(16, 16));
                colors[y * 32 + x] = dist < 14 ? handOpenColor : Color.clear;
            }
        }
        tex.SetPixels(colors);
        tex.Apply();

        sr.sprite = Sprite.Create(tex, new Rect(0, 0, 32, 32), new Vector2(0.5f, 0.5f), 32);
        sr.sortingOrder = 1001;
        joint.transform.localScale = Vector3.one * jointSize;

        return joint;
    }

    LineRenderer CreateBoneLine(int index)
    {
        GameObject lineObj = new GameObject($"Bone_{index}");
        LineRenderer lr = lineObj.AddComponent<LineRenderer>();

        lr.positionCount = 2;
        lr.startWidth = lineWidth;
        lr.endWidth = lineWidth;
        lr.startColor = handOpenColor;
        lr.endColor = handOpenColor;
        lr.sortingOrder = 1000;

        // Use simple unlit material
        lr.material = new Material(Shader.Find("Sprites/Default"));
        lr.material.color = handOpenColor;

        return lr;
    }

    GameObject CreateGrabCursor()
    {
        GameObject cursor = new GameObject("GrabCursor");
        grabCursorRenderer = cursor.AddComponent<SpriteRenderer>();

        // Create a simple, highly visible circle
        int texSize = 64;
        Texture2D tex = new Texture2D(texSize, texSize, TextureFormat.RGBA32, false);
        Color[] colors = new Color[texSize * texSize];
        float center = texSize / 2f;

        for (int y = 0; y < texSize; y++)
        {
            for (int x = 0; x < texSize; x++)
            {
                float dist = Vector2.Distance(new Vector2(x, y), new Vector2(center, center));
                if (dist < 28)
                {
                    // Solid white center (will be tinted by color)
                    colors[y * texSize + x] = Color.white;
                }
                else if (dist < 32)
                {
                    // Darker outline
                    colors[y * texSize + x] = new Color(0.5f, 0.5f, 0.5f, 1f);
                }
                else
                {
                    colors[y * texSize + x] = Color.clear;
                }
            }
        }
        tex.SetPixels(colors);
        tex.filterMode = FilterMode.Point;
        tex.Apply();

        grabCursorRenderer.sprite = Sprite.Create(tex, new Rect(0, 0, texSize, texSize), new Vector2(0.5f, 0.5f), 32f);
        grabCursorRenderer.sortingOrder = 9999; // Maximum to ensure visibility
        grabCursorRenderer.color = cursorOpenColor; // Use configured color
        
        // Use configured cursor size
        cursor.transform.localScale = Vector3.one * cursorSize;

        Debug.Log("[HandTrackingCatcher] GrabCursor created!");
        return cursor;
    }

    // Call this from your MediaPipe hand tracking script (called from background thread!)
    public void UpdateHandLandmarks(HandLandmarkerResult result)
    {
        // Thread-safe: just store the result, process in Update on main thread
        lock (resultLock)
        {
            pendingResult = result;
            hasPendingResult = true;
        }
    }

    // Process the hand landmarks on the main thread
    private void ProcessHandLandmarks(HandLandmarkerResult result)
    {
        currentResult = result;

        if (result.handLandmarks == null || result.handLandmarks.Count == 0)
        {
            handDetected = false;
            isGrabbing = false;
            if (handVisualization != null) handVisualization.SetActive(false);
            if (grabCursor != null) grabCursor.SetActive(false); // Hide cursor too
            return;
        }

        handDetected = true;
        handEverDetected = true;

        // Get the specified hand's landmarks
        if (handIndexToUse < result.handLandmarks.Count)
        {
            var landmarks = result.handLandmarks[handIndexToUse];

            // Show hand visualization
            if (handVisualization != null && showHandSkeleton)
            {
                handVisualization.SetActive(true);
            }

            // Convert all 21 landmarks to world positions
            float cameraDistance = Mathf.Abs(mainCamera.transform.position.z);
            Vector2 screenCenter = new Vector2(UnityEngine.Screen.width / 2f, UnityEngine.Screen.height / 2f);

            // First calculate wrist position as anchor for sensitivity
            var wristLm = landmarks.landmarks[WRIST];
            float wristScreenX = wristLm.x * UnityEngine.Screen.width;
            float wristScreenY = (1f - wristLm.y) * UnityEngine.Screen.height;

            // Apply sensitivity to wrist movement from center
            float sensitiveWristX = screenCenter.x + (wristScreenX - screenCenter.x) * movementSensitivity;
            float sensitiveWristY = screenCenter.y + (wristScreenY - screenCenter.y) * movementSensitivity;

            // Calculate offset to apply to all landmarks (so hand moves but doesn't stretch)
            float offsetX = sensitiveWristX - wristScreenX;
            float offsetY = sensitiveWristY - wristScreenY;

            // First pass: convert all to world positions
            for (int i = 0; i < Mathf.Min(21, landmarks.landmarks.Count); i++)
            {
                var lm = landmarks.landmarks[i];

                // MediaPipe: (0,0) is top-left, (1,1) is bottom-right
                float rawScreenX = lm.x * UnityEngine.Screen.width;
                float rawScreenY = (1f - lm.y) * UnityEngine.Screen.height;

                // Apply same offset to all landmarks (hand moves together, doesn't stretch)
                float screenX = rawScreenX + offsetX;
                float screenY = rawScreenY + offsetY;

                Vector3 worldPos = mainCamera.ScreenToWorldPoint(new Vector3(screenX, screenY, cameraDistance));
                worldPos.z = -1f;
                currentWorldPositions[i] = worldPos;
            }

            // Normalize hand size if enabled
            if (normalizeHandSize)
            {
                // Calculate current hand size (wrist to middle finger MCP)
                Vector3 wristPos = currentWorldPositions[WRIST];
                Vector3 middleMcpPos = currentWorldPositions[MIDDLE_MCP];
                float currentHandSize = Vector3.Distance(wristPos, middleMcpPos);

                if (currentHandSize > 0.01f) // Avoid division by zero
                {
                    // Calculate scale factor to achieve target hand size
                    float scaleFactor = handSize / currentHandSize;

                    // Calculate palm center as the anchor point for scaling
                    Vector3 palmCenter = (currentWorldPositions[WRIST] +
                                         currentWorldPositions[INDEX_MCP] +
                                         currentWorldPositions[MIDDLE_MCP] +
                                         currentWorldPositions[RING_MCP] +
                                         currentWorldPositions[PINKY_MCP]) / 5f;

                    // Scale all landmarks relative to palm center
                    for (int i = 0; i < 21; i++)
                    {
                        Vector3 offset = currentWorldPositions[i] - palmCenter;
                        currentWorldPositions[i] = palmCenter + offset * scaleFactor;
                    }
                }
            }

            // Update joint visuals with final positions
            for (int i = 0; i < Mathf.Min(21, landmarks.landmarks.Count); i++)
            {
                if (jointObjects != null && i < jointObjects.Length && jointObjects[i] != null)
                {
                    jointObjects[i].transform.position = currentWorldPositions[i];
                    jointObjects[i].transform.localScale = Vector3.one * jointSize;
                }
            }

            // Update bone lines
            if (boneLines != null)
            {
                int numConnections = HAND_CONNECTIONS.GetLength(0);
                for (int i = 0; i < numConnections && i < boneLines.Length; i++)
                {
                    if (boneLines[i] != null)
                    {
                        int startIdx = HAND_CONNECTIONS[i, 0];
                        int endIdx = HAND_CONNECTIONS[i, 1];
                        boneLines[i].SetPosition(0, currentWorldPositions[startIdx]);
                        boneLines[i].SetPosition(1, currentWorldPositions[endIdx]);
                        boneLines[i].startWidth = lineWidth;
                        boneLines[i].endWidth = lineWidth;
                    }
                }
            }

            // Calculate palm center (average of wrist and MCP joints)
            palmWorldPos = (currentWorldPositions[WRIST] +
                          currentWorldPositions[INDEX_MCP] +
                          currentWorldPositions[MIDDLE_MCP] +
                          currentWorldPositions[RING_MCP] +
                          currentWorldPositions[PINKY_MCP]) / 5f;

            // Detect grab gesture
            isGrabbing = DetectGrabGesture(landmarks);

            // Update grab cursor - position at palm center
            if (grabCursor != null && showGrabCursor)
            {
                if (!grabCursor.activeSelf)
                {
                    Debug.Log("[HandTrackingCatcher] Activating GrabCursor!");
                }
                grabCursor.SetActive(true);
                // Z = 0 same as other sprites, rely on sorting order
                grabCursor.transform.position = new Vector3(palmWorldPos.x, palmWorldPos.y, 0f);
                // Use configured cursor size
                grabCursor.transform.localScale = Vector3.one * cursorSize;

                // Change cursor color based on grab state
                if (grabCursorRenderer != null)
                {
                    grabCursorRenderer.color = isGrabbing ? cursorClosedColor : cursorOpenColor;
                }
            }
            else if (grabCursor == null)
            {
                Debug.LogError("[HandTrackingCatcher] grabCursor is NULL!");
            }
            else if (!showGrabCursor && grabCursor != null)
            {
                grabCursor.SetActive(false);
            }

            // Update hand skeleton color based on grab state
            UpdateHandColor(isGrabbing ? handClosedColor : handOpenColor);
        }
    }

    // Detect if hand is in a grab/fist gesture
    private bool DetectGrabGesture(Mediapipe.Tasks.Components.Containers.NormalizedLandmarks landmarks)
    {
        if (landmarks.landmarks.Count < 21) return false;

        // Calculate how "closed" each finger is
        // Compare fingertip Y to MCP Y (in normalized coordinates)
        // When finger is curled, tip Y > MCP Y (tip is lower in image)

        float indexCurl = GetFingerCurl(landmarks, INDEX_TIP, INDEX_MCP);
        float middleCurl = GetFingerCurl(landmarks, MIDDLE_TIP, MIDDLE_MCP);
        float ringCurl = GetFingerCurl(landmarks, RING_TIP, RING_MCP);
        float pinkyCurl = GetFingerCurl(landmarks, PINKY_TIP, PINKY_MCP);

        // Average curl of all fingers (excluding thumb which curls differently)
        float averageCurl = (indexCurl + middleCurl + ringCurl + pinkyCurl) / 4f;

        return averageCurl > grabThreshold;
    }

    // Get how curled a finger is (0 = extended, 1 = fully curled)
    private float GetFingerCurl(Mediapipe.Tasks.Components.Containers.NormalizedLandmarks landmarks, int tipIndex, int mcpIndex)
    {
        var tip = landmarks.landmarks[tipIndex];
        var mcp = landmarks.landmarks[mcpIndex];
        var wrist = landmarks.landmarks[WRIST];

        // Calculate distance from tip to wrist vs MCP to wrist
        float tipToWrist = Vector2.Distance(new Vector2(tip.x, tip.y), new Vector2(wrist.x, wrist.y));
        float mcpToWrist = Vector2.Distance(new Vector2(mcp.x, mcp.y), new Vector2(wrist.x, wrist.y));

        // When finger is curled, tip is closer to wrist than when extended
        // Normalize: 0 = tip far from wrist (extended), 1 = tip close to wrist (curled)
        float curl = 1f - Mathf.Clamp01(tipToWrist / (mcpToWrist * 2f));
        return curl;
    }

    // Update hand skeleton color
    private void UpdateHandColor(Color color)
    {
        // Update joint colors
        if (jointObjects != null)
        {
            foreach (var joint in jointObjects)
            {
                if (joint != null)
                {
                    var sr = joint.GetComponent<SpriteRenderer>();
                    if (sr != null) sr.color = color;
                }
            }
        }

        // Update bone line colors
        if (boneLines != null)
        {
            foreach (var line in boneLines)
            {
                if (line != null)
                {
                    line.startColor = color;
                    line.endColor = color;
                    if (line.material != null) line.material.color = color;
                }
            }
        }
    }

    void Update()
    {
        // Process any pending hand tracking results on the main thread
        HandLandmarkerResult resultToProcess = default;
        bool shouldProcess = false;

        lock (resultLock)
        {
            if (hasPendingResult)
            {
                resultToProcess = pendingResult;
                hasPendingResult = false;
                shouldProcess = true;
            }
        }

        if (shouldProcess)
        {
            if (useHandTracking)
            {
                ProcessHandLandmarks(resultToProcess);
            }
            else
            {
                handDetected = false;
                isGrabbing = false;
                if (handVisualization != null) handVisualization.SetActive(false);
                if (grabCursor != null) grabCursor.SetActive(false);
            }
        }

        if (!useHandTracking || !handDetected || Time.timeScale == 0f)
        {
            // Reset canGrab when hand is lost - must see open hand again
            canGrab = false;
            return;
        }

        // If hand is currently open, allow grabbing
        if (!isGrabbing)
        {
            canGrab = true;
        }

        // Check for fish catch ONLY when ALL conditions are met:
        // 1. Hand is currently in grab position (isGrabbing)
        // 2. We saw an open hand since last catch attempt (canGrab)
        // 3. This is the moment of closing (transition from open to closed)
        if (isGrabbing && canGrab && !wasGrabbing)
        {
            CheckForFishCatch();
            canGrab = false; // Must open hand again before next catch
        }

        wasGrabbing = isGrabbing;
    }

    void CheckForFishCatch()
    {
        // Cooldown check
        if (Time.time - lastCatchTime < catchCooldown)
        {
            return;
        }

        lastCatchTime = Time.time;
        bool caughtFish = false;

        // Find all colliders near palm position (grab area)
        Collider2D[] hits = Physics2D.OverlapCircleAll(palmWorldPos, catchRadius);

        foreach (var hit in hits)
        {
            FishCatcher catcher = hit.GetComponent<FishCatcher>();
            if (catcher != null)
            {
                // Catch the fish! (this already handles stats via FishCatcher.OnClick)
                catcher.OnClick();
                caughtFish = true;

                // Visual feedback
                StartCoroutine(CatchFeedback());

                Debug.Log($"[HandTrackingCatcher] CAUGHT FISH with grab gesture!");
                break; // Only catch one fish at a time
            }
        }

        // If grab didn't catch any fish, count as missed click (like clicking empty space)
        if (!caughtFish)
        {
            if (SessionStats.Instance != null)
            {
                SessionStats.Instance.OnFishClickAttempt(
                    hitFish: false,
                    isCorrect: false,
                    clickWorldPos: palmWorldPos,
                    reactionTime: 0f
                );

                // Update streak display after missed grab
                if (GameManager.Instance != null)
                {
                    GameManager.Instance.UpdateStreakUI();
                }
            }
            Debug.Log($"[HandTrackingCatcher] Grab missed - no fish caught");
        }
    }

    IEnumerator CatchFeedback()
    {
        if (grabCursor != null && grabCursorRenderer != null)
        {
            // Flash the cursor
            Vector3 originalScale = grabCursor.transform.localScale;
            grabCursor.transform.localScale = originalScale * 1.3f;

            Color originalColor = grabCursorRenderer.color;
            grabCursorRenderer.color = Color.yellow; // Flash yellow on catch
            yield return new WaitForSeconds(0.15f);
            grabCursorRenderer.color = originalColor;

            grabCursor.transform.localScale = originalScale;
        }
    }

    // Optional: Draw debug gizmos
    void OnDrawGizmos()
    {
        if (handDetected)
        {
            Gizmos.color = isGrabbing ? Color.green : Color.white;
            Gizmos.DrawWireSphere(palmWorldPos, catchRadius);
        }
    }

    public void SetUseHandTracking(bool use)
    {
        useHandTracking = use;
        if (!use && handVisualization != null)
        {
            handVisualization.SetActive(false);
        }
        if (!use && grabCursor != null)
        {
            grabCursor.SetActive(false);
        }
    }

    public void ApplySettings(
        bool useTracking,
        int handIndex,
        float sensitivity,
        bool showSkeleton,
        bool normalizeSize,
        float size,
        bool showCursor,
        float newCursorSize,
        float newGrabThreshold,
        float newJointSize
    )
    {
        useHandTracking = useTracking;
        handIndexToUse = Mathf.Max(0, handIndex);
        movementSensitivity = Mathf.Max(0f, sensitivity);
        showHandSkeleton = showSkeleton;
        normalizeHandSize = normalizeSize;
        handSize = Mathf.Clamp(size, 0f, 100f);
        showGrabCursor = showCursor;
        cursorSize = Mathf.Clamp(newCursorSize, 1f, 100f);
        grabThreshold = Mathf.Clamp01(newGrabThreshold);
        jointSize = Mathf.Max(0f, newJointSize);

        if (!useHandTracking)
        {
            if (handVisualization != null) handVisualization.SetActive(false);
            if (grabCursor != null) grabCursor.SetActive(false);
            handDetected = false;
            isGrabbing = false;
            wasGrabbing = false;
            canGrab = false;
        }
        else
        {
            if (!showHandSkeleton && handVisualization != null) handVisualization.SetActive(false);
            if (!showGrabCursor && grabCursor != null) grabCursor.SetActive(false);
            handDetected = false;
            isGrabbing = false;
            wasGrabbing = false;
            canGrab = false;
        }

        if (grabCursor != null)
        {
            grabCursor.transform.localScale = Vector3.one * cursorSize;
        }
    }

    public void ResetHandTrackingUsage()
    {
        handEverDetected = false;
    }

    public bool WasHandTrackingUsed()
    {
        return handEverDetected;
    }

    public bool IsHandDetected()
    {
        return handDetected;
    }

    public bool IsHandTrackingEnabled()
    {
        return useHandTracking;
    }

    public int GetHandIndexToUse()
    {
        return handIndexToUse;
    }

    public float GetMovementSensitivity()
    {
        return movementSensitivity;
    }

    public bool GetShowHandSkeleton()
    {
        return showHandSkeleton;
    }

    public bool GetNormalizeHandSize()
    {
        return normalizeHandSize;
    }

    public float GetHandSize()
    {
        return handSize;
    }

    public bool GetShowGrabCursor()
    {
        return showGrabCursor;
    }

    public float GetCursorSize()
    {
        return cursorSize;
    }

    public float GetGrabThreshold()
    {
        return grabThreshold;
    }

    public float GetJointSize()
    {
        return jointSize;
    }

    public bool IsGrabbing()
    {
        return isGrabbing;
    }

    public Vector2 GetHandPosition()
    {
        return palmWorldPos;
    }
}
