using UnityEngine;
using UnityEngine.InputSystem;

public class ClickDetector : MonoBehaviour
{
    void Update()
    {
        // Don't process clicks when game is paused
        if (Time.timeScale == 0f)
        {
            return;
        }

        if (Mouse.current.leftButton.wasPressedThisFrame)
        {
            Vector2 mousePos = Mouse.current.position.ReadValue();
            Vector2 worldPos = Camera.main.ScreenToWorldPoint(mousePos);

            RaycastHit2D hit = Physics2D.Raycast(worldPos, Vector2.zero);

            if (hit.collider != null)
            {
                FishCatcher catcher = hit.collider.GetComponent<FishCatcher>();
                if (catcher != null)
                {
                    catcher.OnClick();
                }
            }
            else
            {
                if (SessionStats.Instance != null)
                {
                    SessionStats.Instance.OnFishClickAttempt(
                        hitFish: false,
                        isCorrect: false,
                        clickWorldPos: worldPos,
                        reactionTime: 0f
                    );

                    // Update streak display after missed click
                    if (GameManager.Instance != null)
                    {
                        GameManager.Instance.UpdateStreakUI();
                    }
                }
            }
        }
    }
}
