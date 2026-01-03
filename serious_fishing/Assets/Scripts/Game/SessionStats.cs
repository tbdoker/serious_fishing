using UnityEngine;
using System.Collections.Generic;

[System.Serializable]
public class ZoneClickEntry
{
    public string zone;
    public int count;
}

[System.Serializable]
public class QuadrantStats
{
    public int correct = 0;
    public int wrong = 0;
    
    public float GetAccuracy()
    {
        int total = correct + wrong;
        return total == 0 ? 0f : (float)correct / total;
    }
}

public class SessionStats : MonoBehaviour
{
    public static SessionStats Instance;

    [Header("Performance Metrics")]
    public int correctFish = 0;
    public int wrongFish = 0;
    public int missedFish = 0;
    public int totalHits = 0;
    public int maxStreak = 0;

    [Header("Quadrant Accuracy (correct/wrong per quadrant)")]
    public QuadrantStats topLeft = new QuadrantStats();
    public QuadrantStats topRight = new QuadrantStats();
    public QuadrantStats bottomLeft = new QuadrantStats();
    public QuadrantStats bottomRight = new QuadrantStats();

    [Header("Session Timer (Count-Up)")]
    [SerializeField] private float sessionElapsedTime = 0f;
    [SerializeField] private bool sessionRunning = false;

    [Header("Internal State")]
    [SerializeField] private int currentStreak = 0;

    [Header("Collected Data")]
    [SerializeField] private List<float> reactionTimes = new List<float>();
    [SerializeField] private List<Vector2> clickPositions = new List<Vector2>();
    [SerializeField] private List<bool> clickResults = new List<bool>(); // true = correct, false = wrong

    // Internal dictionary (fast access)
    private Dictionary<string, int> zoneClicks = new Dictionary<string, int>()
    {
        { "topLeft", 0 }, { "topMiddle", 0 }, { "topRight", 0 },
        { "middleLeft", 0 }, { "middleMiddle", 0 }, { "middleRight", 0 },
        { "bottomLeft", 0 }, { "bottomMiddle", 0 }, { "bottomRight", 0 },
    };

    // Inspector-visible version
    [SerializeField] private List<ZoneClickEntry> zoneClickList = new List<ZoneClickEntry>();

    // --------------------------------------------------
    // LIFECYCLE
    // --------------------------------------------------

    void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    void Update()
    {
        if (sessionRunning)
        {
            sessionElapsedTime += Time.deltaTime;
        }

        // Debug grid (optional, remove for build)
        DrawZoneGrid();
    }

    // --------------------------------------------------
    // SESSION CONTROL
    // --------------------------------------------------

    public void StartSession()
    {
        ResetSessionData();
        sessionElapsedTime = 0f;
        sessionRunning = true;

        Debug.Log("Session started");
    }

    public void EndSession()
    {
        sessionRunning = false;

        Debug.Log($"Session ended. Duration: {sessionElapsedTime:F2} seconds");
    }

    public void ResetSessionData()
    {
        correctFish = 0;
        wrongFish = 0;
        missedFish = 0;
        totalHits = 0;
        maxStreak = 0;
        currentStreak = 0;
        sessionElapsedTime = 0f;

        reactionTimes.Clear();
        clickPositions.Clear();
        clickResults.Clear();

        // Reset quadrant stats
        topLeft = new QuadrantStats();
        topRight = new QuadrantStats();
        bottomLeft = new QuadrantStats();
        bottomRight = new QuadrantStats();

        // Reset zone clicks
        foreach (var key in new List<string>(zoneClicks.Keys))
        {
            zoneClicks[key] = 0;
        }
        zoneClickList.Clear();

        Debug.Log("Session data reset");
    }

    public float GetSessionTime()
    {
        return sessionElapsedTime;
    }

    public int GetCurrentStreak()
    {
        return currentStreak;
    }

    // --------------------------------------------------
    // GAME EVENTS
    // --------------------------------------------------

    public void OnFishClickAttempt(bool hitFish, bool isCorrect, Vector2 clickWorldPos, float reactionTime)
    {
        totalHits++;
        clickPositions.Add(clickWorldPos);
        RecordClickZone(clickWorldPos);

        if (hitFish)
        {
            if (isCorrect)
            {
                reactionTimes.Add(reactionTime);
            }
            clickResults.Add(isCorrect); // Track result for this click

            // Record quadrant accuracy
            RecordQuadrantAccuracy(clickWorldPos, isCorrect);

            if (isCorrect)
            {
                correctFish++;
                currentStreak++;
                if (currentStreak > maxStreak)
                    maxStreak = currentStreak;
            }
            else
            {
                wrongFish++;
                currentStreak = 0;
            }
        }
        // Note: Don't reset streak on missed clicks in empty space
        // Only reset on wrong fish or escaped fish
    }

    private void RecordQuadrantAccuracy(Vector2 pos, bool isCorrect)
    {
        float orthoSize = Camera.main.orthographicSize;
        float height = orthoSize * 2f;
        float width = height * Camera.main.aspect;

        // Determine quadrant (2x2 grid)
        bool isTop = pos.y > 0;
        bool isRight = pos.x > 0;

        QuadrantStats quadrant;
        if (isTop && !isRight) quadrant = topLeft;
        else if (isTop && isRight) quadrant = topRight;
        else if (!isTop && !isRight) quadrant = bottomLeft;
        else quadrant = bottomRight;

        if (isCorrect)
            quadrant.correct++;
        else
            quadrant.wrong++;
    }

    public void OnFishMissed(FishData.FishType fishType)
    {
        // Only count as missed if it was the target fish
        if (GameManager.Instance != null && fishType == GameManager.Instance.currentTarget)
        {
            missedFish++;
            // NOTE: Streak is NOT reset when target fish escapes
            // Streak only resets when wrong fish is caught
        }
    }

    // --------------------------------------------------
    // ANALYTICS
    // --------------------------------------------------

    public float GetAccuracy()
    {
        int total = correctFish + wrongFish;
        return total == 0 ? 0f : (float)correctFish / total;
    }

    public float GetHitEffectiveness()
    {
        return totalHits == 0 ? 0f : (float)correctFish / totalHits;
    }

    public float GetAverageReactionTime()
    {
        if (reactionTimes.Count == 0) return 0f;

        float sum = 0f;
        foreach (float t in reactionTimes)
            sum += t;

        return sum / reactionTimes.Count;
    }

    public float GetHorizontalSpread()
    {
        if (clickPositions.Count == 0) return 0f;

        float minX = float.MaxValue;
        float maxX = float.MinValue;

        foreach (var pos in clickPositions)
        {
            minX = Mathf.Min(minX, pos.x);
            maxX = Mathf.Max(maxX, pos.x);
        }

        return maxX - minX;
    }

    public float GetVerticalSpread()
    {
        if (clickPositions.Count == 0) return 0f;

        float minY = float.MaxValue;
        float maxY = float.MinValue;

        foreach (var pos in clickPositions)
        {
            minY = Mathf.Min(minY, pos.y);
            maxY = Mathf.Max(maxY, pos.y);
        }

        return maxY - minY;
    }

    // --------------------------------------------------
    // ZONE TRACKING (3x3 GRID)
    // --------------------------------------------------

    private void RecordClickZone(Vector2 pos)
    {
        float orthoSize = Camera.main.orthographicSize;
        float height = orthoSize * 2f;
        float width = height * Camera.main.aspect;

        float thirdH = height / 3f;
        float thirdW = width / 3f;

        float bottom = -height / 2f;
        float left = -width / 2f;

        string vertical =
            pos.y < bottom + thirdH ? "bottom" :
            pos.y < bottom + 2 * thirdH ? "middle" : "top";

        string horizontal =
            pos.x < left + thirdW ? "Left" :
            pos.x < left + 2 * thirdW ? "Middle" : "Right";

        string key = vertical + horizontal;

        if (zoneClicks.ContainsKey(key))
            zoneClicks[key]++;

        ZoneClickEntry entry = zoneClickList.Find(e => e.zone == key);
        if (entry != null)
            entry.count++;
        else
            zoneClickList.Add(new ZoneClickEntry { zone = key, count = 1 });
    }

    public Dictionary<string, float> GetZoneClickPercentages()
    {
        int total = 0;
        foreach (int c in zoneClicks.Values)
            total += c;

        Dictionary<string, float> result = new Dictionary<string, float>();
        foreach (var pair in zoneClicks)
            result[pair.Key] = total == 0 ? 0f : pair.Value * 100f / total;

        return result;
    }

    // --------------------------------------------------
    // QUADRANT ACCURACY GETTERS
    // --------------------------------------------------

    public Dictionary<string, float> GetQuadrantAccuracies()
    {
        return new Dictionary<string, float>
        {
            { "topLeft", topLeft.GetAccuracy() },
            { "topRight", topRight.GetAccuracy() },
            { "bottomLeft", bottomLeft.GetAccuracy() },
            { "bottomRight", bottomRight.GetAccuracy() }
        };
    }

    public List<bool> GetClickResults()
    {
        return new List<bool>(clickResults);
    }

    // --------------------------------------------------
    // DEBUG GRID (OPTIONAL)
    // --------------------------------------------------

    void DrawZoneGrid()
    {
        float orthoSize = Camera.main.orthographicSize;
        float height = orthoSize * 2f;
        float width = height * Camera.main.aspect;

        float thirdH = height / 3f;
        float thirdW = width / 3f;

        float left = -width / 2f;
        float right = width / 2f;
        float bottom = -height / 2f;
        float top = height / 2f;

        Debug.DrawLine(new Vector3(left + thirdW, bottom, 0), new Vector3(left + thirdW, top, 0), Color.red);
        Debug.DrawLine(new Vector3(left + 2 * thirdW, bottom, 0), new Vector3(left + 2 * thirdW, top, 0), Color.red);

        Debug.DrawLine(new Vector3(left, bottom + thirdH, 0), new Vector3(right, bottom + thirdH, 0), Color.blue);
        Debug.DrawLine(new Vector3(left, bottom + 2 * thirdH, 0), new Vector3(right, bottom + 2 * thirdH, 0), Color.blue);
    }
}
