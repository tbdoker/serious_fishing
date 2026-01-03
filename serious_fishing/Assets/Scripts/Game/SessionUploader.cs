using UnityEngine;
using UnityEngine.Networking;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class SessionUploader : MonoBehaviour
{
    [Header("Backend")]
    public string backendBaseUrl = "http://127.0.0.1:5001";

    [Header("Game Settings Reference")]
    public GameSettings gameSettings;

    [Header("Hand Tracking")]
    [SerializeField] private HandTrackingCatcher handTrackingCatcher;

    private DateTime sessionStartTime;

    void Start()
    {
        sessionStartTime = DateTime.UtcNow;

        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }

        if (handTrackingCatcher != null)
        {
            handTrackingCatcher.ResetHandTrackingUsage();
        }

        if (SessionStats.Instance != null)
        {
            SessionStats.Instance.StartSession();
        }
    }

    /// <summary>
    /// Call this when the therapist ends the session (from SessionEnder or End Session button)
    /// </summary>
    public void UploadSessionData()
    {
        if (string.IsNullOrEmpty(GameSessionContext.userId))
        {
            Debug.LogError("SessionUploader: userId is null, cannot upload session");
            return;
        }

        if (SessionStats.Instance == null)
        {
            Debug.LogError("SessionUploader: SessionStats.Instance is null");
            return;
        }

        StartCoroutine(UploadCoroutine());
    }

    IEnumerator UploadCoroutine()
    {
        SessionStats stats = SessionStats.Instance;
        DateTime endTime = DateTime.UtcNow;

        // Build the game settings data
        GameSettingsData settingsData = null;
        if (gameSettings != null)
        {
            settingsData = new GameSettingsData
            {
                speedMultiplier = gameSettings.speedMultiplier,
                minSpawnInterval = gameSettings.minSpawnInterval,
                maxSpawnInterval = gameSettings.maxSpawnInterval,
                spawnFrom = gameSettings.spawnFrom.ToString(),
                targetFishMode = gameSettings.targetFishMode.ToString()
            };
        }

        // Build quadrant accuracy data
        var quadrantAccuracies = stats.GetQuadrantAccuracies();
        QuadrantAccuracyData quadrantData = new QuadrantAccuracyData
        {
            topLeft = quadrantAccuracies["topLeft"],
            topRight = quadrantAccuracies["topRight"],
            bottomLeft = quadrantAccuracies["bottomLeft"],
            bottomRight = quadrantAccuracies["bottomRight"]
        };

        // Build the DTO from SessionStats
        SessionDTO dto = new SessionDTO
        {
            userId = GameSessionContext.userId,
            username = GameSessionContext.username,
            sessionStartTime = sessionStartTime.ToString("o"), // ISO 8601
            sessionEndTime = endTime.ToString("o"),
            sessionDuration = stats.GetSessionTime(),

            gameSettings = settingsData,
            handTrackingUsed = handTrackingCatcher != null && handTrackingCatcher.WasHandTrackingUsed(),

            correctFish = stats.correctFish,
            wrongFish = stats.wrongFish,
            missedFish = stats.missedFish,
            totalClicks = stats.totalHits,

            fishAccuracy = stats.GetAccuracy(),
            clickEffectiveness = stats.GetHitEffectiveness(),

            quadrantAccuracy = quadrantData,

            averageReactionTime = stats.GetAverageReactionTime(),
            fastestReactionTime = GetFastestReactionTime(),
            slowestReactionTime = GetSlowestReactionTime(),
            allReactionTimes = GetReactionTimesList(),

            maxStreak = stats.maxStreak,

            clickPositions = GetClickPositionsList(),
            horizontalSpread = stats.GetHorizontalSpread(),
            verticalSpread = stats.GetVerticalSpread(),

            zoneHeatmap = GetZoneHeatmapList()
        };

        string json = JsonUtility.ToJson(dto);
        Debug.Log("Uploading session data: " + json);

        string url = backendBaseUrl + "/save-session";

        using UnityWebRequest req = new UnityWebRequest(url, "POST");
        req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to upload session: " + req.error);
        }
        else
        {
            Debug.Log("Session uploaded successfully!");
        }
    }

    // --------------------------------------------------
    // HELPERS (using reflection to access private fields)
    // --------------------------------------------------

    private float GetFastestReactionTime()
    {
        var reactionTimes = GetReactionTimesList();
        return reactionTimes.Count > 0 ? reactionTimes.Min() : 0f;
    }

    private float GetSlowestReactionTime()
    {
        var reactionTimes = GetReactionTimesList();
        return reactionTimes.Count > 0 ? reactionTimes.Max() : 0f;
    }

    private List<float> GetReactionTimesList()
    {
        var field = typeof(SessionStats).GetField("reactionTimes",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        if (field != null)
        {
            return (List<float>)field.GetValue(SessionStats.Instance);
        }

        return new List<float>();
    }

    private List<ClickPositionData> GetClickPositionsList()
    {
        var field = typeof(SessionStats).GetField("clickPositions",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        if (field != null)
        {
            List<Vector2> positions = (List<Vector2>)field.GetValue(SessionStats.Instance);
            List<bool> results = SessionStats.Instance.GetClickResults();
            List<ClickPositionData> result = new List<ClickPositionData>();

            for (int i = 0; i < positions.Count; i++)
            {
                // Only include click positions where a fish was actually hit (we have a result for it)
                bool isCorrect = (i < results.Count) ? results[i] : true;
                result.Add(new ClickPositionData 
                { 
                    x = positions[i].x, 
                    y = positions[i].y,
                    correct = isCorrect
                });
            }

            return result;
        }

        return new List<ClickPositionData>();
    }

    private List<ZoneHeatmapData> GetZoneHeatmapList()
    {
        Dictionary<string, float> percentages = SessionStats.Instance.GetZoneClickPercentages();
        List<ZoneHeatmapData> result = new List<ZoneHeatmapData>();

        foreach (var pair in percentages)
        {
            result.Add(new ZoneHeatmapData
            {
                zone = pair.Key,
                percentage = pair.Value
            });
        }

        return result;
    }
}
