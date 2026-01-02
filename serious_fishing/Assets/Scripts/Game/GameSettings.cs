using UnityEngine;

[CreateAssetMenu(fileName = "GameSettings", menuName = "Game/Game Settings")]
public class GameSettings : ScriptableObject
{
    public enum SpawnSide { Left, Right }
    public enum TargetFishMode { Random, FixedRed, FixedBlue, FixedYellow, FixedPink, FixedGreen }

    [Header("Speed Settings")]
    public float speedMultiplier = 1f;

    [Header("Spawn Settings")]
    public float minSpawnInterval = 2f;
    public float maxSpawnInterval = 5f;
    public SpawnSide spawnFrom = SpawnSide.Left;

    [Header("Target Fish Settings")]
    public TargetFishMode targetFishMode = TargetFishMode.Random;

    public float GetRandomSpeed()
    {
        return Random.Range(50f, 150f) * speedMultiplier;
    }

    public float GetRandomInterval()
    {
        return Random.Range(minSpawnInterval, maxSpawnInterval);
    }
}
