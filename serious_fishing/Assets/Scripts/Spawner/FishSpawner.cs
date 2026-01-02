using UnityEngine;

public class FishSpawner : MonoBehaviour
{
    public GameObject fishPrefab;

    public Sprite redFishSprite;
    public Sprite blueFishSprite;
    public Sprite yellowFishSprite;
    public Sprite pinkFishSprite;
    public Sprite greenFishSprite;

    public GameSettings settings;

    void Start()
    {
        ClearAllFish();
        SpawnFish();
    }

    public void ClearAllFish()
    {
        // Find all fish objects in the scene and destroy them
        GameObject[] allFish = GameObject.FindGameObjectsWithTag("Fish");
        foreach (GameObject fish in allFish)
        {
            Destroy(fish);
        }

        // Cancel any pending spawns
        CancelInvoke("SpawnFish");

        Debug.Log($"Cleared {allFish.Length} fish from scene");
    }

    public void RestartSpawning()
    {
        ClearAllFish();
        SpawnFish();
        Debug.Log("Fish spawning restarted");
    }

    public void StopSpawning()
    {
        ClearAllFish();
        Debug.Log("Fish spawning stopped");
    }

    void SpawnFish()
    {
        float spawnY = Random.Range(-150f, 150f);

        // Pick left or right side based on settings
        Vector3 edge = (settings.spawnFrom == GameSettings.SpawnSide.Left)
            ? Camera.main.ViewportToWorldPoint(new Vector3(0, 0.5f, 0))
            : Camera.main.ViewportToWorldPoint(new Vector3(1, 0.5f, 0));

        // Offset so fish don't spawn at exactly edge
        float direction = (settings.spawnFrom == GameSettings.SpawnSide.Left) ? 1f : -1f;
        Vector3 spawnPos = new Vector3(edge.x + direction * 1f, spawnY, 0f);

        // Instantiate fish
        GameObject fish = Instantiate(fishPrefab, spawnPos, Quaternion.identity);
        fish.transform.localScale *= 1.25f;

        // Set spawn time
        FishData data = fish.GetComponent<FishData>();
        data.spawnTime = Time.time;

        // Choose sprite color
        SpriteRenderer sr = fish.GetComponent<SpriteRenderer>();
        int randomType = Random.Range(0, 5);
        switch (randomType)
        {
            case 0: data.type = FishData.FishType.Red; sr.sprite = redFishSprite; break;
            case 1: data.type = FishData.FishType.Blue; sr.sprite = blueFishSprite; break;
            case 2: data.type = FishData.FishType.Yellow; sr.sprite = yellowFishSprite; break;
            case 3: data.type = FishData.FishType.Pink; sr.sprite = pinkFishSprite; break;
            case 4: data.type = FishData.FishType.Green; sr.sprite = greenFishSprite; break;
        }

        // Flip fish if moving right
        sr.flipX = (settings.spawnFrom == GameSettings.SpawnSide.Left);

        // Apply speed
        FishMovement movement = fish.GetComponent<FishMovement>();
        movement.speed = settings.GetRandomSpeed();
        movement.direction = (settings.spawnFrom == GameSettings.SpawnSide.Left)
            ? Vector2.right
            : Vector2.left;

        // Schedule next spawn based on continuous interval range
        float nextSpawnIn = settings.GetRandomInterval();
        Invoke("SpawnFish", nextSpawnIn);
    }
}
