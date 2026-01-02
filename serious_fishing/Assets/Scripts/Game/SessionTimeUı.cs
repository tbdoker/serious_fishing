using UnityEngine;
using TMPro;

public class SessionTimerUI : MonoBehaviour
{
    public TextMeshProUGUI timerText;

    void Update()
    {
        if (SessionStats.Instance == null) return;

        float time = SessionStats.Instance.GetSessionTime();
        int minutes = Mathf.FloorToInt(time / 60f);
        int seconds = Mathf.FloorToInt(time % 60f);

        timerText.text = $"{minutes:00}:{seconds:00}";
    }
}
