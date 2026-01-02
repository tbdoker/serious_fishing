using System;

[Serializable]
public class GameSettingsDTO
{
    public float speedMultiplier;
    public float minSpawnInterval;
    public float maxSpawnInterval;
    public string spawnFrom;        // "Left" or "Right"
    public string targetFishMode;   // "Random", "FixedRed", "FixedBlue", etc.
}
