using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// Controls the pause functionality when ESC is pressed during gameplay.
/// Uses UI Toolkit pause menu managed by Login script.
/// </summary>
public class PauseMenuController : MonoBehaviour
{
    [Header("References")]
    public Login loginController;

    private bool isPaused = false;

    void Update()
    {
        if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame)
        {
            // If settings is open, close everything and unpause
            if (loginController != null && loginController.IsSettingsOpen())
            {
                loginController.CloseSettings();
                isPaused = false;
                Time.timeScale = 1f;
                loginController.HidePauseMenu();
            }
            // Otherwise toggle pause
            else
            {
                TogglePause();
            }
        }
    }

    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0f : 1f;

        if (loginController != null)
        {
            if (isPaused)
                loginController.ShowPauseMenu();
            else
                loginController.HidePauseMenu();
        }
    }

    public void Resume()
    {
        isPaused = false;
        Time.timeScale = 1f;

        if (loginController != null)
            loginController.HidePauseMenu();
    }
}
