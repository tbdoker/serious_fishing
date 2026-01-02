using UnityEngine;

public class MenuFishSpawner : MonoBehaviour
{
    [Header("Fish")]
    public GameObject fishPrefab;

    [Header("Spawn Settings")]
    public float minSpawnInterval = 1.5f;
    public float maxSpawnInterval = 3f;
    public float minY = -150f;
    public float maxY = 150f;

    private bool isRunning = true;

    void Start()
    {
        Debug.Log("MenuFishSpawner START");
        Invoke(nameof(SpawnFish), 0.5f);
    }

    void SpawnFish()
    {
        if (!isRunning) return;

        Debug.Log("MenuFishSpawner SPAWN");

        float spawnY = Random.Range(minY, maxY);

        Vector3 leftEdge = Camera.main.ViewportToWorldPoint(
            new Vector3(0, 0.5f, Camera.main.nearClipPlane)
        );

        Vector3 spawnPos = new Vector3(leftEdge.x - 1f, spawnY, 0f);

        GameObject fish = Instantiate(fishPrefab, spawnPos, Quaternion.identity);

        // Tag this fish as MENU
        fish.name = "MENU_FISH";

        // Setup movement
        FishMovement movement = fish.GetComponent<FishMovement>();
        if (movement != null)
        {
            movement.direction = Vector2.right;
            movement.speed = Random.Range(20f, 40f);
        }

        float nextSpawn = Random.Range(minSpawnInterval, maxSpawnInterval);
        Invoke(nameof(SpawnFish), nextSpawn);
    }

    public void StopAndClear()
    {
        isRunning = false;
        CancelInvoke();

        GameObject[] allFish = GameObject.FindGameObjectsWithTag("Fish");
        foreach (var fish in allFish)
        {
            if (fish.name.Contains("MENU"))
                Destroy(fish);
        }
    }
}
