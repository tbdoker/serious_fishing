using System;

[Serializable]
public class GameSettingsDTO
{
    public float speedMultiplier;
    public float minSpawnInterval;
    public float maxSpawnInterval;
    public string spawnFrom;        // "Left" or "Right"
    public string targetFishMode;   // "Random", "FixedRed", "FixedBlue", etc.
    public bool useHandTracking;
    public int handIndexToUse;
    public float movementSensitivity;
    public bool showHandSkeleton;
    public bool normalizeHandSize;
    public float handSize;
    public bool showGrabCursor;
    public float cursorSize;
    public float grabThreshold;
    public float jointSize;
}
