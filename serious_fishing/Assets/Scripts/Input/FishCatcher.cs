using UnityEngine;

public class FishCatcher : MonoBehaviour
{
    public void OnClick()
    {
        // Don't allow clicks when game is paused
        if (Time.timeScale == 0f)
        {
            return;
        }

        FishData data = GetComponent<FishData>();
        if (data == null)
        {
            Debug.LogError("FishData is missing from this object!", gameObject);
            return;
        }

        if (GameManager.Instance == null)
        {
            Debug.LogError("GameManager instance is not set!");
            return;
        }
        bool isCorrect = data.type == GameManager.Instance.currentTarget;

        Vector2 clickPos = transform.position;
        float reaction = Time.time - data.spawnTime;

        SessionStats.Instance.OnFishClickAttempt(
            hitFish: true,
            isCorrect: isCorrect,
            clickWorldPos: clickPos,
            reactionTime: reaction
        );

        if (isCorrect)
        {
            GameManager.Instance.IncreaseScore(1);
            GameManager.Instance.ShowFeedback("Great, keep going!");

            // Change target fish for next catch (only if in Random mode)
            GameManager.Instance.SetRandomTargetFish();
        }
        else
        {
            GameManager.Instance.ShowFeedback("Unlucky, but keep trying!");
        }

        // Update streak display
        GameManager.Instance.UpdateStreakUI();

        var audioManager = AudioManager.Instance ?? FindFirstObjectByType<AudioManager>();
        if (audioManager != null)
        {
            if (isCorrect)
            {
                audioManager.PlayCorrectFish();
            }
            else
            {
                audioManager.PlayWrongFish();
            }
            audioManager.PlayVfx();
        }

        Debug.Log($"[Reaction] Clicked {data.type} fish | Spawned at: {data.spawnTime:F2} | Clicked at: {Time.time:F2} | Reaction: {reaction:F2}s");
        Destroy(gameObject);
    }

}
