using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System;

public class GameSettingsManager : MonoBehaviour
{
    [Header("References")]
    public GameSettings gameSettings;

    [Header("Hand Tracking")]
    [SerializeField] private HandTrackingCatcher handTrackingCatcher;

    [Header("Backend")]
    public string backendBaseUrl = "http://127.0.0.1:5001";

    [Header("Real-time Sync")]
    [Tooltip("How often to check for settings changes (in seconds)")]
    public float pollInterval = 2f;
    
    private Coroutine pollingCoroutine;
    private bool isPolling = false;

    // Flag to track if settings have been loaded
    public bool SettingsLoaded { get; private set; } = false;

    void Awake()
    {
        // Verify gameSettings is assigned
        if (gameSettings == null)
        {
            Debug.LogError("[GameSettingsManager] gameSettings is NOT assigned! Please assign DefaultGameSettings asset in the Inspector.");
        }
        else
        {
            Debug.Log($"[GameSettingsManager] Using settings asset: {gameSettings.name}");
        }

        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }
    }

    // --------------------------------------------------
    // REAL-TIME POLLING
    // --------------------------------------------------

    /// <summary>
    /// Start polling for settings changes from backend
    /// </summary>
    public void StartPolling()
    {
        if (isPolling) return;
        
        if (string.IsNullOrEmpty(GameSessionContext.userId))
        {
            Debug.LogWarning("[GameSettingsManager] Cannot start polling - no user logged in");
            return;
        }

        isPolling = true;
        pollingCoroutine = StartCoroutine(PollSettingsCoroutine());
        Debug.Log($"[GameSettingsManager] Started polling for settings changes every {pollInterval}s");
    }

    /// <summary>
    /// Stop polling for settings changes
    /// </summary>
    public void StopPolling()
    {
        if (!isPolling) return;

        isPolling = false;
        if (pollingCoroutine != null)
        {
            StopCoroutine(pollingCoroutine);
            pollingCoroutine = null;
        }
        Debug.Log("[GameSettingsManager] Stopped polling for settings changes");
    }

    private IEnumerator PollSettingsCoroutine()
    {
        while (isPolling && !string.IsNullOrEmpty(GameSessionContext.userId))
        {
            yield return new WaitForSeconds(pollInterval);
            
            if (!isPolling) break;
            
            // Silently fetch and apply settings
            yield return FetchSettingsSilent();
        }
    }

    private IEnumerator FetchSettingsSilent()
    {
        string url = backendBaseUrl + "/game-settings?userId=" + GameSessionContext.userId;

        using UnityWebRequest req = UnityWebRequest.Get(url);
        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            GameSettingsDTO dto = JsonUtility.FromJson<GameSettingsDTO>(req.downloadHandler.text);
            ApplySettings(dto);
        }
    }

    // --------------------------------------------------
    // PUBLIC API
    // --------------------------------------------------

    /// <summary>
    /// Fetch settings for the currently logged-in user (fire and forget).
    /// Must be called AFTER login (userId exists).
    /// </summary>
    public void FetchSettingsForCurrentUser()
    {
        StartCoroutine(FetchSettingsCoroutineInternal(null));
    }

    /// <summary>
    /// Fetch settings and invoke callback when done.
    /// Use this when you need to wait for settings to load.
    /// </summary>
    public void FetchSettingsWithCallback(Action onComplete)
    {
        StartCoroutine(FetchSettingsCoroutineInternal(onComplete));
    }

    /// <summary>
    /// Coroutine version - can be yielded to wait for completion.
    /// Usage: yield return StartCoroutine(settingsManager.FetchSettingsCoroutine());
    /// </summary>
    public IEnumerator FetchSettingsCoroutine()
    {
        yield return FetchSettingsCoroutineInternal(null);
    }

    private IEnumerator FetchSettingsCoroutineInternal(Action onComplete)
    {
        SettingsLoaded = false;

        if (string.IsNullOrEmpty(GameSessionContext.userId))
        {
            Debug.LogError("GameSettingsManager: userId is null or empty");
            onComplete?.Invoke();
            yield break;
        }

        string url = backendBaseUrl + "/game-settings?userId=" + GameSessionContext.userId;

        using UnityWebRequest req = UnityWebRequest.Get(url);
        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to fetch game settings: " + req.error);
            onComplete?.Invoke();
            yield break;
        }

        GameSettingsDTO dto = JsonUtility.FromJson<GameSettingsDTO>(req.downloadHandler.text);
        ApplySettings(dto);

        SettingsLoaded = true;
        Debug.Log($"[GameSettingsManager] Settings loaded: speed={dto.speedMultiplier}, spawn={dto.minSpawnInterval}-{dto.maxSpawnInterval}, side={dto.spawnFrom}, mode={dto.targetFishMode}");

        onComplete?.Invoke();
    }

    /// <summary>
    /// Push updated settings for the current user to backend.
    /// Useful for pause menu / therapist UI.
    /// </summary>
    public void SaveCurrentSettingsForUser()
    {
        if (string.IsNullOrEmpty(GameSessionContext.userId))
        {
            Debug.LogError("GameSettingsManager: userId is null or empty");
            return;
        }

        string url =
            backendBaseUrl +
            "/game-settings?userId=" +
            GameSessionContext.userId +
            "&username=" +
            UnityWebRequest.EscapeURL(GameSessionContext.username ?? "");

        StartCoroutine(SaveSettingsCoroutine(url));
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    IEnumerator SaveSettingsCoroutine(string url)
    {
        GameSettingsDTO dto = new GameSettingsDTO
        {
            speedMultiplier = gameSettings.speedMultiplier,
            minSpawnInterval = gameSettings.minSpawnInterval,
            maxSpawnInterval = gameSettings.maxSpawnInterval,
            spawnFrom = gameSettings.spawnFrom.ToString(),
            targetFishMode = gameSettings.targetFishMode.ToString(),
            useHandTracking = handTrackingCatcher != null && handTrackingCatcher.IsHandTrackingEnabled(),
            handIndexToUse = handTrackingCatcher != null ? handTrackingCatcher.GetHandIndexToUse() : 0,
            movementSensitivity = handTrackingCatcher != null ? handTrackingCatcher.GetMovementSensitivity() : 1.5f,
            showHandSkeleton = handTrackingCatcher != null && handTrackingCatcher.GetShowHandSkeleton(),
            normalizeHandSize = handTrackingCatcher != null && handTrackingCatcher.GetNormalizeHandSize(),
            handSize = handTrackingCatcher != null ? handTrackingCatcher.GetHandSize() : 5f,
            showGrabCursor = handTrackingCatcher != null && handTrackingCatcher.GetShowGrabCursor(),
            cursorSize = handTrackingCatcher != null ? handTrackingCatcher.GetCursorSize() : 3f,
            grabThreshold = handTrackingCatcher != null ? handTrackingCatcher.GetGrabThreshold() : 0.6f,
            jointSize = handTrackingCatcher != null ? handTrackingCatcher.GetJointSize() : 7f
        };

        string json = JsonUtility.ToJson(dto);

        using UnityWebRequest req =
            new UnityWebRequest(url, "POST");

        req.uploadHandler =
            new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to save game settings: " + req.error);
            yield break;
        }

        Debug.Log("Game settings saved for user " + GameSessionContext.userId);
    }

    // --------------------------------------------------
    // APPLY
    // --------------------------------------------------

    void ApplySettings(GameSettingsDTO dto)
    {
        if (gameSettings == null)
        {
            Debug.LogError("GameSettings reference is missing!");
            return;
        }

        Debug.Log($"[GameSettingsManager] BEFORE applying - speedMultiplier={gameSettings.speedMultiplier}, spawnFrom={gameSettings.spawnFrom}, interval={gameSettings.minSpawnInterval}-{gameSettings.maxSpawnInterval}");

        // Track if target fish mode changed
        var oldTargetMode = gameSettings.targetFishMode;

        gameSettings.speedMultiplier = dto.speedMultiplier;
        gameSettings.minSpawnInterval = dto.minSpawnInterval;
        gameSettings.maxSpawnInterval = dto.maxSpawnInterval;

        gameSettings.spawnFrom =
            dto.spawnFrom == "Left"
                ? GameSettings.SpawnSide.Left
                : GameSettings.SpawnSide.Right;

        // Apply target fish mode
        switch (dto.targetFishMode)
        {
            case "FixedRed":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedRed;
                break;
            case "FixedBlue":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedBlue;
                break;
            case "FixedYellow":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedYellow;
                break;
            case "FixedPink":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedPink;
                break;
            case "FixedGreen":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedGreen;
                break;
            default:
                gameSettings.targetFishMode = GameSettings.TargetFishMode.Random;
                break;
        }

        Debug.Log($"[GameSettingsManager] AFTER applying - speedMultiplier={gameSettings.speedMultiplier}, spawnFrom={gameSettings.spawnFrom}, interval={gameSettings.minSpawnInterval}-{gameSettings.maxSpawnInterval}, targetMode={gameSettings.targetFishMode}");

        // If target fish mode changed, update the target fish immediately
        if (oldTargetMode != gameSettings.targetFishMode && GameManager.Instance != null)
        {
            GameManager.Instance.SetRandomTargetFish();
            Debug.Log($"[GameSettingsManager] Target fish mode changed from {oldTargetMode} to {gameSettings.targetFishMode} - updating target fish");
        }

        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }

        if (handTrackingCatcher != null)
        {
            handTrackingCatcher.ApplySettings(
                dto.useHandTracking,
                dto.handIndexToUse,
                dto.movementSensitivity,
                dto.showHandSkeleton,
                dto.normalizeHandSize,
                dto.handSize,
                dto.showGrabCursor,
                dto.cursorSize,
                dto.grabThreshold,
                dto.jointSize
            );
        }
    }
}
