using UnityEngine;

public class FishMovement : MonoBehaviour
{
    public float speed = 50f;
    public Vector2 direction = Vector2.left;

    private SpriteRenderer sr;

    void Awake()
    {
        sr = GetComponent<SpriteRenderer>();
    }

    void Start()
    {
        // Flip sprite to match movement
        if (sr != null)
        {
            sr.flipX = direction.x > 0;
        }
    }

    void Update()
    {
        transform.Translate(direction * speed * Time.deltaTime);

        float leftEdge = Camera.main.ViewportToWorldPoint(new Vector3(0, 0, 0)).x;
        float rightEdge = Camera.main.ViewportToWorldPoint(new Vector3(1, 0, 0)).x;

        if (transform.position.x < leftEdge - 1f || transform.position.x > rightEdge + 1f)
        {
            // Only gameplay fish affect stats
            if (!gameObject.name.Contains("MENU") && SessionStats.Instance != null)
            {
                FishData fishData = GetComponent<FishData>();
                if (fishData != null)
                {
                    SessionStats.Instance.OnFishMissed(fishData.type);
                }
            }

            Destroy(gameObject);
        }
    }
}
