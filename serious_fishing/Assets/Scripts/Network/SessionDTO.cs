using System;
using System.Collections.Generic;

[Serializable]
public class ClickPositionData
{
    public float x;
    public float y;
    public bool correct; // Whether this was a correct or wrong fish
}

[Serializable]
public class ZoneHeatmapData
{
    public string zone;
    public float percentage;
}

[Serializable]
public class QuadrantAccuracyData
{
    public float topLeft;
    public float topRight;
    public float bottomLeft;
    public float bottomRight;
}

[Serializable]
public class GameSettingsData
{
    public float speedMultiplier;
    public float minSpawnInterval;
    public float maxSpawnInterval;
    public string spawnFrom;        // "Left" or "Right"
    public string targetFishMode;   // "Random", "FixedRed", "FixedBlue", etc.
}

[Serializable]
public class SessionDTO
{
    // User identification
    public string userId;
    public string username;

    // Session timing
    public string sessionStartTime;  // ISO 8601 format
    public string sessionEndTime;    // ISO 8601 format
    public float sessionDuration;    // In seconds

    // Game settings used during this session
    public GameSettingsData gameSettings;

    // Input mode
    public bool handTrackingUsed;

    // Fish interaction metrics
    public int correctFish;
    public int wrongFish;
    public int missedFish;
    public int totalClicks;

    // Accuracy metrics
    public float fishAccuracy;           // correctFish / (correctFish + wrongFish)
    public float clickEffectiveness;     // correctFish / totalClicks

    // Quadrant accuracy (2x2 grid)
    public QuadrantAccuracyData quadrantAccuracy;

    // Reaction time metrics
    public float averageReactionTime;
    public float fastestReactionTime;
    public float slowestReactionTime;
    public List<float> allReactionTimes;

    // Streak data
    public int maxStreak;

    // Spatial data (for heatmap)
    public List<ClickPositionData> clickPositions;
    public float horizontalSpread;
    public float verticalSpread;

    // Zone heatmap (3x3 grid)
    public List<ZoneHeatmapData> zoneHeatmap;
}
