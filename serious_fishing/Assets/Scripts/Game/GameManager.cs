using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    [Header("UI")]
    public TextMeshProUGUI scoreText;
    public Image targetFishImage;
    public TextMeshProUGUI targetText;
    public TextMeshProUGUI feedbackText;
    public TextMeshProUGUI streakText;
    public TextMeshProUGUI maxStreakText;

    [Header("Fish Sprites")]
    public Sprite redFishSprite, blueFishSprite, yellowFishSprite, pinkFishSprite, greenFishSprite;

    [Header("Settings")]
    public GameSettings gameSettings;

    private int score = 0;
    public FishData.FishType currentTarget;

    void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    void Start()
    {
        ResetGame();
    }

    public void ResetGame()
    {
        score = 0;
        UpdateScoreUI();
        UpdateStreakUI();
        SetRandomTargetFish();

        // Clear feedback text
        if (feedbackText != null)
        {
            StopAllCoroutines();
            feedbackText.text = "";
            feedbackText.alpha = 0f;
        }

        Debug.Log("Game reset - score and target fish refreshed");
    }

    public void IncreaseScore(int amount)
    {
        score += amount;
        UpdateScoreUI();
    }

    void UpdateScoreUI()
    {
        scoreText.text = score.ToString();
    }

    public void UpdateStreakUI()
    {
        if (SessionStats.Instance != null)
        {
            int currentStreak = SessionStats.Instance.GetCurrentStreak();
            int maxStreak = SessionStats.Instance.maxStreak;

            if (streakText != null)
            {
                streakText.text = $"Streak: {currentStreak}";

                // Make streak text more exciting when high
                if (currentStreak >= 5)
                {
                    streakText.color = new Color(1f, 0.84f, 0f); // Gold
                }
                else if (currentStreak >= 3)
                {
                    streakText.color = new Color(0.4f, 1f, 0.4f); // Light green
                }
                else
                {
                    streakText.color = Color.white;
                }
            }

            if (maxStreakText != null)
            {
                maxStreakText.text = $"Best: {maxStreak}";
            }
        }
    }

    public void SetRandomTargetFish()
    {
        // Check if settings specify a fixed target
        if (gameSettings != null)
        {
            switch (gameSettings.targetFishMode)
            {
                case GameSettings.TargetFishMode.FixedRed:
                    currentTarget = FishData.FishType.Red;
                    break;
                case GameSettings.TargetFishMode.FixedBlue:
                    currentTarget = FishData.FishType.Blue;
                    break;
                case GameSettings.TargetFishMode.FixedYellow:
                    currentTarget = FishData.FishType.Yellow;
                    break;
                case GameSettings.TargetFishMode.FixedPink:
                    currentTarget = FishData.FishType.Pink;
                    break;
                case GameSettings.TargetFishMode.FixedGreen:
                    currentTarget = FishData.FishType.Green;
                    break;
                default: // Random
                    currentTarget = (FishData.FishType)Random.Range(0, 5);
                    break;
            }
        }
        else
        {
            // Fallback to random if no settings
            currentTarget = (FishData.FishType)Random.Range(0, 5);
        }

        string fishName = "";
        switch (currentTarget)
        {
            case FishData.FishType.Red:
                targetFishImage.sprite = redFishSprite;
                fishName = "RED";
                break;
            case FishData.FishType.Blue:
                targetFishImage.sprite = blueFishSprite;
                fishName = "BLUE";
                break;
            case FishData.FishType.Yellow:
                targetFishImage.sprite = yellowFishSprite;
                fishName = "YELLOW";
                break;
            case FishData.FishType.Pink:
                targetFishImage.sprite = pinkFishSprite;
                fishName = "PINK";
                break;
            case FishData.FishType.Green:
                targetFishImage.sprite = greenFishSprite;
                fishName = "GREEN";
                break;
        }

        if (targetText != null)
        {
            targetText.text = $"Catch the {fishName} fish!";
        }
    }
     public void ShowFeedback(string message)
    {
        StopAllCoroutines();
        StartCoroutine(FeedbackRoutine(message));
    }

    private IEnumerator FeedbackRoutine(string message)
    {
        if (feedbackText == null) yield break;

        feedbackText.text = message;
        feedbackText.alpha = 1f;

        yield return new WaitForSeconds(1.5f);

        float fadeDuration = 0.5f;
        float t = 0f;
        while (t < fadeDuration)
        {
            feedbackText.alpha = Mathf.Lerp(1f, 0f, t / fadeDuration);
            t += Time.deltaTime;
            yield return null;
        }

        feedbackText.alpha = 0f;
    }
}
