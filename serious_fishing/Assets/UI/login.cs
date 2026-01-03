using UnityEngine;
using UnityEngine.UIElements;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;
using System.Text;

public class Login : MonoBehaviour
{
    [Header("Backend")]
    public string backendBaseUrl = "http://127.0.0.1:5001";

    [Header("UI Toolkit")]
    public UIDocument uiDocument;

    [Header("Game References")]
    public GameObject gameRoot;
    public MenuFishSpawner menuFishSpawner;
    public GameSettings gameSettings;
    public HandTrackingCatcher handTrackingCatcher;

    // UI references
    private VisualElement loginView;
    private VisualElement registerView;
    private VisualElement welcomeView;
    private VisualElement settingsPanel;
    private VisualElement pauseMenu;

    private Label welcomeText;
    private Label errorLabel;
    private Label successLabel;

    private bool settingsOpenedFromPause = false;

    // Login fields
    private TextField loginUsername;
    private TextField loginPassword;

    // Register fields
    private TextField regUsername;
    private TextField regFirstName;
    private TextField regLastName;
    private TextField regAge;
    private TextField regPassword;
    private TextField regConfirm;

    // Settings panel elements
    private Slider speedSlider;
    private Slider minSpawnSlider;
    private Slider maxSpawnSlider;
    private DropdownField spawnDropdown;
    private DropdownField targetFishDropdown;
    private Label speedValue;
    private Label minSpawnValue;
    private Label maxSpawnValue;
    private Toggle useHandTrackingToggle;
    private DropdownField handIndexDropdown;
    private Slider movementSensitivitySlider;
    private Label movementSensitivityValue;
    private Toggle showHandSkeletonToggle;
    private Toggle normalizeHandSizeToggle;
    private Slider handSizeSlider;
    private Label handSizeValue;
    private Toggle showGrabCursorToggle;
    private Slider cursorSizeSlider;
    private Label cursorSizeValue;
    private Slider grabThresholdSlider;
    private Label grabThresholdValue;
    private Slider jointSizeSlider;
    private Label jointSizeValue;

    // --------------------------------------------------
    // INITIALIZATION
    // --------------------------------------------------
    void OnEnable()
    {
        if (gameRoot != null)
            gameRoot.SetActive(false);

        if (uiDocument == null)
        {
            Debug.LogError("Login: uiDocument is not assigned (UIDocument).");
            return;
        }

        var root = uiDocument.rootVisualElement;
        if (root == null)
        {
            Debug.LogError("Login: uiDocument.rootVisualElement is null (UI not ready yet).");
            return;
        }

        // Error and Success labels (outside overlay)
        errorLabel = root.Q<Label>("errorLabel");
        if (errorLabel != null)
        {
            errorLabel.AddToClassList("hidden");
            errorLabel.style.display = DisplayStyle.None;
        }

        successLabel = root.Q<Label>("successLabel");
        if (successLabel != null)
        {
            successLabel.AddToClassList("hidden");
        }

        // Get overlay element
        var overlay = root.Q<VisualElement>("overlay");
        if (overlay == null)
        {
            Debug.LogError("Login: Could not find VisualElement named 'overlay' in login.uxml.");
            return;
        }

        // Views
        loginView = overlay.Q<VisualElement>("loginView");
        registerView = overlay.Q<VisualElement>("registerView");
        welcomeView = overlay.Q<VisualElement>("welcomeView");
        // settingsPanel is outside overlay in login.uxml, so query from root.
        settingsPanel = root.Q<VisualElement>("settingsPanel");
        // pauseMenu is outside overlay in login.uxml, so query from root.
        pauseMenu = root.Q<VisualElement>("pauseMenu");

        // Login fields
        loginUsername = overlay.Q<TextField>("loginUsername");
        loginPassword = overlay.Q<TextField>("loginPassword");
        var loginButton = overlay.Q<Button>("btnLogin");
        var toRegisterBtn = overlay.Q<Button>("linkToRegister");

        // Register fields
        regUsername = overlay.Q<TextField>("regUsername");
        regFirstName = overlay.Q<TextField>("regFirstName");
        regLastName = overlay.Q<TextField>("regLastName");
        regAge = overlay.Q<TextField>("regAge");
        regPassword = overlay.Q<TextField>("regPassword");
        regConfirm = overlay.Q<TextField>("regConfirm");
        var registerButton = overlay.Q<Button>("btnRegister");
        var toLoginBtn = overlay.Q<Button>("linkToLogin");

        // Welcome view fields
        welcomeText = overlay.Q<Label>("welcomeText");
        var btnStartPlaying = overlay.Q<Button>("btnStartPlaying");
        var btnWelcomeSettings = overlay.Q<Button>("btnWelcomeSettings");
        var btnLogout = overlay.Q<Button>("btnLogout");
        var btnQuit = overlay.Q<Button>("btnQuit");

        // Settings panel elements (inside settingsPanel which is outside overlay)
        speedSlider = root.Q<Slider>("speedSlider");
        minSpawnSlider = root.Q<Slider>("minSpawnSlider");
        maxSpawnSlider = root.Q<Slider>("maxSpawnSlider");
        spawnDropdown = root.Q<DropdownField>("spawnDropdown");
        targetFishDropdown = root.Q<DropdownField>("targetFishDropdown");
        speedValue = root.Q<Label>("speedValue");
        minSpawnValue = root.Q<Label>("minSpawnValue");
        maxSpawnValue = root.Q<Label>("maxSpawnValue");
        useHandTrackingToggle = root.Q<Toggle>("useHandTrackingToggle");
        handIndexDropdown = root.Q<DropdownField>("handIndexDropdown");
        movementSensitivitySlider = root.Q<Slider>("movementSensitivitySlider");
        movementSensitivityValue = root.Q<Label>("movementSensitivityValue");
        showHandSkeletonToggle = root.Q<Toggle>("showHandSkeletonToggle");
        normalizeHandSizeToggle = root.Q<Toggle>("normalizeHandSizeToggle");
        handSizeSlider = root.Q<Slider>("handSizeSlider");
        handSizeValue = root.Q<Label>("handSizeValue");
        showGrabCursorToggle = root.Q<Toggle>("showGrabCursorToggle");
        cursorSizeSlider = root.Q<Slider>("cursorSizeSlider");
        cursorSizeValue = root.Q<Label>("cursorSizeValue");
        grabThresholdSlider = root.Q<Slider>("grabThresholdSlider");
        grabThresholdValue = root.Q<Label>("grabThresholdValue");
        jointSizeSlider = root.Q<Slider>("jointSizeSlider");
        jointSizeValue = root.Q<Label>("jointSizeValue");
        var btnSaveSettings = root.Q<Button>("btnSaveSettings");
        var btnCloseSettings = root.Q<Button>("btnCloseSettings");

        // Pause menu elements
        var btnContinue = pauseMenu?.Q<Button>("btnContinue");
        var btnPauseSettings = pauseMenu?.Q<Button>("btnPauseSettings");
        var btnSaveAndEnd = pauseMenu?.Q<Button>("btnSaveAndEnd");
        var btnReturnToMenu = pauseMenu?.Q<Button>("btnReturnToMenu");

        // Button bindings
        if (loginButton != null) { loginButton.clicked -= OnLoginClicked; loginButton.clicked += OnLoginClicked; }
        if (registerButton != null) { registerButton.clicked -= OnRegisterClicked; registerButton.clicked += OnRegisterClicked; }
        if (toRegisterBtn != null) { toRegisterBtn.clicked -= ShowRegister; toRegisterBtn.clicked += ShowRegister; }
        if (toLoginBtn != null) { toLoginBtn.clicked -= ShowLogin; toLoginBtn.clicked += ShowLogin; }

        // Welcome view button bindings
        if (btnStartPlaying != null) { btnStartPlaying.clicked -= OnStartPlaying; btnStartPlaying.clicked += OnStartPlaying; }
        if (btnWelcomeSettings != null) { btnWelcomeSettings.clicked -= OnOpenSettings; btnWelcomeSettings.clicked += OnOpenSettings; }
        if (btnLogout != null) { btnLogout.clicked -= OnLogout; btnLogout.clicked += OnLogout; }
        if (btnQuit != null) { btnQuit.clicked -= OnQuitGame; btnQuit.clicked += OnQuitGame; }

        // Settings panel bindings
        if (speedSlider != null) { speedSlider.UnregisterValueChangedCallback(OnSpeedChanged); speedSlider.RegisterValueChangedCallback(OnSpeedChanged); }
        if (minSpawnSlider != null) { minSpawnSlider.UnregisterValueChangedCallback(OnMinSpawnChanged); minSpawnSlider.RegisterValueChangedCallback(OnMinSpawnChanged); }
        if (maxSpawnSlider != null) { maxSpawnSlider.UnregisterValueChangedCallback(OnMaxSpawnChanged); maxSpawnSlider.RegisterValueChangedCallback(OnMaxSpawnChanged); }
        if (targetFishDropdown != null) { targetFishDropdown.UnregisterValueChangedCallback(OnTargetFishChanged); targetFishDropdown.RegisterValueChangedCallback(OnTargetFishChanged); }
        if (useHandTrackingToggle != null) { useHandTrackingToggle.UnregisterValueChangedCallback(OnUseHandTrackingChanged); useHandTrackingToggle.RegisterValueChangedCallback(OnUseHandTrackingChanged); }
        if (movementSensitivitySlider != null) { movementSensitivitySlider.UnregisterValueChangedCallback(OnMovementSensitivityChanged); movementSensitivitySlider.RegisterValueChangedCallback(OnMovementSensitivityChanged); }
        if (normalizeHandSizeToggle != null) { normalizeHandSizeToggle.UnregisterValueChangedCallback(OnNormalizeHandSizeChanged); normalizeHandSizeToggle.RegisterValueChangedCallback(OnNormalizeHandSizeChanged); }
        if (handSizeSlider != null) { handSizeSlider.UnregisterValueChangedCallback(OnHandSizeChanged); handSizeSlider.RegisterValueChangedCallback(OnHandSizeChanged); }
        if (showGrabCursorToggle != null) { showGrabCursorToggle.UnregisterValueChangedCallback(OnShowGrabCursorChanged); showGrabCursorToggle.RegisterValueChangedCallback(OnShowGrabCursorChanged); }
        if (cursorSizeSlider != null) { cursorSizeSlider.UnregisterValueChangedCallback(OnCursorSizeChanged); cursorSizeSlider.RegisterValueChangedCallback(OnCursorSizeChanged); }
        if (grabThresholdSlider != null) { grabThresholdSlider.UnregisterValueChangedCallback(OnGrabThresholdChanged); grabThresholdSlider.RegisterValueChangedCallback(OnGrabThresholdChanged); }
        if (jointSizeSlider != null) { jointSizeSlider.UnregisterValueChangedCallback(OnJointSizeChanged); jointSizeSlider.RegisterValueChangedCallback(OnJointSizeChanged); }
        if (btnSaveSettings != null) { btnSaveSettings.clicked -= OnSaveSettings; btnSaveSettings.clicked += OnSaveSettings; }
        if (btnCloseSettings != null) { btnCloseSettings.clicked -= OnCloseSettings; btnCloseSettings.clicked += OnCloseSettings; }

        // Pause menu bindings
        if (btnContinue != null) { btnContinue.clicked -= OnContinue; btnContinue.clicked += OnContinue; }
        if (btnPauseSettings != null) { btnPauseSettings.clicked -= OnPauseSettingsClicked; btnPauseSettings.clicked += OnPauseSettingsClicked; }
        if (btnSaveAndEnd != null) { btnSaveAndEnd.clicked -= OnSaveAndEnd; btnSaveAndEnd.clicked += OnSaveAndEnd; }
        if (btnReturnToMenu != null) { btnReturnToMenu.clicked -= OnReturnToMenu; btnReturnToMenu.clicked += OnReturnToMenu; }

        // Setup spawn dropdown
        if (spawnDropdown != null)
        {
            spawnDropdown.choices = new List<string> { "Left", "Right" };
            spawnDropdown.value = "Right";
        }

        // Setup target fish dropdown
        if (targetFishDropdown != null)
        {
            targetFishDropdown.choices = new List<string> {
                "Random (changes each catch)",
                "Fixed: Red",
                "Fixed: Blue",
                "Fixed: Yellow",
                "Fixed: Pink",
                "Fixed: Green"
            };
            targetFishDropdown.value = "Random (changes each catch)";
        }

        if (handIndexDropdown != null)
        {
            handIndexDropdown.choices = new List<string> { "0", "1" };
            handIndexDropdown.value = "0";
        }

        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }

        ShowLogin();
    }

    // --------------------------------------------------
    // VIEW SWITCHING
    // --------------------------------------------------
    void ShowLogin()
    {
        loginView?.RemoveFromClassList("hidden");
        registerView?.AddToClassList("hidden");
        welcomeView?.AddToClassList("hidden");
        settingsPanel?.AddToClassList("hidden");
        pauseMenu?.AddToClassList("hidden");
    }

    void ShowRegister()
    {
        loginView?.AddToClassList("hidden");
        registerView?.RemoveFromClassList("hidden");
        welcomeView?.AddToClassList("hidden");
        settingsPanel?.AddToClassList("hidden");
        pauseMenu?.AddToClassList("hidden");
    }

    void ShowWelcomeView()
    {
        loginView?.AddToClassList("hidden");
        registerView?.AddToClassList("hidden");
        welcomeView?.RemoveFromClassList("hidden");
        settingsPanel?.AddToClassList("hidden");
        pauseMenu?.AddToClassList("hidden");

        if (welcomeText != null && !string.IsNullOrEmpty(GameSessionContext.fullName))
        {
            welcomeText.text = $"Welcome, {GameSessionContext.fullName}!";
        }
    }

    // --------------------------------------------------
    // LOGIN
    // --------------------------------------------------
    void OnLoginClicked()
    {
        if (string.IsNullOrEmpty(loginUsername.value))
        {
            Debug.Log("Login failed: Username empty");
            return;
        }

        StartCoroutine(LoginCoroutine());
    }

    IEnumerator LoginCoroutine()
    {
        LoginRequest payload = new LoginRequest
        {
            username = loginUsername.value,
            password = loginPassword.value
        };

        string json = JsonUtility.ToJson(payload);

        using UnityWebRequest req = new UnityWebRequest(
            backendBaseUrl + "/login", "POST");

        req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Login HTTP error: " + req.error);
            yield break;
        }

        AuthResponse res =
            JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);

        if (!res.ok)
        {
            Debug.Log("Login failed: " + res.message);
            ShowError("Invalid credentials. Please try again.");
            yield break;
        }

        GameSessionContext.userId = res.userId;
        GameSessionContext.username = res.username;
        GameSessionContext.fullName = res.firstName + " " + res.lastName;

        Debug.Log($"Welcome {GameSessionContext.fullName}");

        FindFirstObjectByType<GameSettingsManager>()?.
            FetchSettingsForCurrentUser();

        ShowWelcome();
    }

    void ShowError(string message)
    {
        if (errorLabel != null)
        {
            errorLabel.text = message;
            errorLabel.RemoveFromClassList("hidden");
            errorLabel.style.display = DisplayStyle.Flex;
            errorLabel.style.opacity = 1f;
            errorLabel.BringToFront();
            StartCoroutine(HideErrorAfterDelay(3f));
        }
    }

    IEnumerator HideErrorAfterDelay(float delay)
    {
        yield return new WaitForSecondsRealtime(delay);
        if (errorLabel != null)
        {
            errorLabel.AddToClassList("hidden");
            errorLabel.style.display = DisplayStyle.None;
        }
    }

    void ShowSuccessNotification(string message)
    {
        if (successLabel != null)
        {
            successLabel.text = message;
            successLabel.RemoveFromClassList("hidden");
            StartCoroutine(HideSuccessAfterDelay(1f)); // Reduced from 2f to 1f
        }
    }

    IEnumerator HideSuccessAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);
        if (successLabel != null)
            successLabel.AddToClassList("hidden");
    }

    void HideSuccessNotification()
    {
        if (successLabel != null)
            successLabel.AddToClassList("hidden");
    }

    // --------------------------------------------------
    // REGISTER
    // --------------------------------------------------
    void OnRegisterClicked()
    {
        if (string.IsNullOrEmpty(regUsername.value) ||
            string.IsNullOrEmpty(regFirstName.value) ||
            string.IsNullOrEmpty(regLastName.value) ||
            string.IsNullOrEmpty(regAge.value))
        {
            Debug.Log("Register failed: Missing fields");
            ShowError("Please fill in all fields.");
            return;
        }

        if (!int.TryParse(regAge.value, out int age) || age <= 0)
        {
            Debug.Log("Register failed: Invalid age");
            ShowError("Please enter a valid age.");
            return;
        }

        if (regPassword.value != regConfirm.value)
        {
            Debug.Log("Register failed: Passwords do not match");
            ShowError("Passwords do not match.");
            return;
        }

        StartCoroutine(RegisterCoroutine(age));
    }

    IEnumerator RegisterCoroutine(int age)
    {
        RegisterRequest payload = new RegisterRequest
        {
            username = regUsername.value,
            firstName = regFirstName.value,
            lastName = regLastName.value,
            age = age,
            password = regPassword.value
        };

        string json = JsonUtility.ToJson(payload);

        using UnityWebRequest req = new UnityWebRequest(
            backendBaseUrl + "/register", "POST");

        req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Register HTTP error: " + req.error);
            ShowError("Connection error. Please try again.");
            yield break;
        }

        AuthResponse res =
            JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);

        if (!res.ok)
        {
            Debug.Log("Register failed: " + res.message);
            ShowError(res.message);
            yield break;
        }

        Debug.Log("Register successful. Please login.");
        ShowSuccessNotification("Registration successful! Please login.");
        ShowLogin();
    }

    // --------------------------------------------------
    // WELCOME SCREEN
    // --------------------------------------------------
    void ShowWelcome()
    {
        if (menuFishSpawner != null)
            menuFishSpawner.StopAndClear();

        ShowWelcomeView();
    }

    void OnStartPlaying()
    {
        Debug.Log("Start Playing clicked - fetching latest settings...");
        StartCoroutine(StartPlayingWithFreshSettings());
    }

    IEnumerator StartPlayingWithFreshSettings()
    {
        // Fetch latest settings from backend before starting
        GameSettingsManager settingsManager = FindFirstObjectByType<GameSettingsManager>();
        if (settingsManager != null)
        {
            yield return StartCoroutine(settingsManager.FetchSettingsCoroutine());
            
            // Start real-time polling for settings changes
            settingsManager.StartPolling();
        }

        // Hide the entire UI overlay but keep UIDocument active for pause menu
        var overlay = uiDocument.rootVisualElement.Q<VisualElement>("overlay");
        if (overlay != null)
            overlay.style.display = DisplayStyle.None;

        if (gameRoot != null)
            gameRoot.SetActive(true);

        // Ensure hand tracking runner restarts after returning to menu
        var handRunner = FindFirstObjectByType<GameHandLandmarkerRunner>();
        handRunner?.Play();

        // Ensure PauseMenuController is active
        PauseMenuController pauseController = FindFirstObjectByType<PauseMenuController>();
        if (pauseController != null)
        {
            pauseController.gameObject.SetActive(true);
        }

        // Reset game state and start fresh session
        GameManager gameManager = FindFirstObjectByType<GameManager>();
        if (gameManager != null)
            gameManager.ResetGame();

        // Clear all existing fish and restart spawning
        FishSpawner fishSpawner = FindFirstObjectByType<FishSpawner>();
        if (fishSpawner != null)
            fishSpawner.RestartSpawning();

        if (SessionStats.Instance != null)
            SessionStats.Instance.StartSession();

        Debug.Log("Game started with real-time settings sync enabled");
    }

    void OnLogout()
    {
        Debug.Log("Logout clicked");

        // Stop polling when logging out
        GameSettingsManager settingsManager = FindFirstObjectByType<GameSettingsManager>();
        settingsManager?.StopPolling();

        GameSessionContext.userId = null;
        GameSessionContext.username = null;
        GameSessionContext.fullName = null;

        ShowLogin();
    }

    // --------------------------------------------------
    // SETTINGS PANEL
    // --------------------------------------------------
    void OnOpenSettings()
    {
        // Hide all other views when opening settings from welcome menu
        if (loginView != null) loginView.AddToClassList("hidden");
        if (registerView != null) registerView.AddToClassList("hidden");
        if (welcomeView != null) welcomeView.AddToClassList("hidden");
        if (pauseMenu != null) pauseMenu.AddToClassList("hidden");

        settingsOpenedFromPause = false;
        LoadSettingsToUI();
        if (settingsPanel != null) settingsPanel.RemoveFromClassList("hidden");
    }

    void LoadSettingsToUI()
    {
        if (gameSettings == null) return;

        if (speedSlider != null)
        {
            speedSlider.value = gameSettings.speedMultiplier;
            speedValue.text = $"{gameSettings.speedMultiplier:F1}x";
        }

        if (minSpawnSlider != null)
        {
            minSpawnSlider.value = gameSettings.minSpawnInterval;
            minSpawnValue.text = $"{gameSettings.minSpawnInterval:F1}s";
        }

        if (maxSpawnSlider != null)
        {
            maxSpawnSlider.value = gameSettings.maxSpawnInterval;
            maxSpawnValue.text = $"{gameSettings.maxSpawnInterval:F1}s";
        }

        if (spawnDropdown != null)
        {
            spawnDropdown.value = gameSettings.spawnFrom == GameSettings.SpawnSide.Left ? "Left" : "Right";
        }

        if (targetFishDropdown != null)
        {
            switch (gameSettings.targetFishMode)
            {
                case GameSettings.TargetFishMode.Random:
                    targetFishDropdown.value = "Random (changes each catch)";
                    break;
                case GameSettings.TargetFishMode.FixedRed:
                    targetFishDropdown.value = "Fixed: Red";
                    break;
                case GameSettings.TargetFishMode.FixedBlue:
                    targetFishDropdown.value = "Fixed: Blue";
                    break;
                case GameSettings.TargetFishMode.FixedYellow:
                    targetFishDropdown.value = "Fixed: Yellow";
                    break;
                case GameSettings.TargetFishMode.FixedPink:
                    targetFishDropdown.value = "Fixed: Pink";
                    break;
                case GameSettings.TargetFishMode.FixedGreen:
                    targetFishDropdown.value = "Fixed: Green";
                    break;
            }
        }

        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }

        if (useHandTrackingToggle != null)
        {
            useHandTrackingToggle.value = handTrackingCatcher != null
                ? handTrackingCatcher.IsHandTrackingEnabled()
                : true;
        }

        if (handIndexDropdown != null)
        {
            int handIndex = handTrackingCatcher != null ? handTrackingCatcher.GetHandIndexToUse() : 0;
            handIndexDropdown.value = handIndex.ToString();
        }

        if (movementSensitivitySlider != null)
        {
            float sensitivity = handTrackingCatcher != null ? handTrackingCatcher.GetMovementSensitivity() : 1.5f;
            movementSensitivitySlider.value = sensitivity;
            if (movementSensitivityValue != null)
            {
                movementSensitivityValue.text = $"{sensitivity:F1}x";
            }
        }

        if (showHandSkeletonToggle != null)
        {
            showHandSkeletonToggle.value = handTrackingCatcher != null
                ? handTrackingCatcher.GetShowHandSkeleton()
                : true;
        }

        if (normalizeHandSizeToggle != null)
        {
            normalizeHandSizeToggle.value = handTrackingCatcher != null
                ? handTrackingCatcher.GetNormalizeHandSize()
                : true;
        }

        if (handSizeSlider != null)
        {
            float size = handTrackingCatcher != null ? handTrackingCatcher.GetHandSize() : 5f;
            handSizeSlider.value = size;
            if (handSizeValue != null)
            {
                handSizeValue.text = $"{size:F0}";
            }
        }

        if (showGrabCursorToggle != null)
        {
            showGrabCursorToggle.value = handTrackingCatcher != null
                ? handTrackingCatcher.GetShowGrabCursor()
                : true;
        }

        if (cursorSizeSlider != null)
        {
            float size = handTrackingCatcher != null ? handTrackingCatcher.GetCursorSize() : 3f;
            cursorSizeSlider.value = size;
            if (cursorSizeValue != null)
            {
                cursorSizeValue.text = $"{size:F0}";
            }
        }

        if (grabThresholdSlider != null)
        {
            float threshold = handTrackingCatcher != null ? handTrackingCatcher.GetGrabThreshold() : 0.6f;
            grabThresholdSlider.value = threshold;
            if (grabThresholdValue != null)
            {
                grabThresholdValue.text = $"{threshold:F2}";
            }
        }

        if (jointSizeSlider != null)
        {
            float size = handTrackingCatcher != null ? handTrackingCatcher.GetJointSize() : 7f;
            jointSizeSlider.value = size;
            if (jointSizeValue != null)
            {
                jointSizeValue.text = $"{size:F0}";
            }
        }

        UpdateHandTrackingControlStates();
    }

    void OnSpeedChanged(ChangeEvent<float> evt)
    {
        if (speedValue != null)
            speedValue.text = $"{evt.newValue:F1}x";
    }

    void OnMinSpawnChanged(ChangeEvent<float> evt)
    {
        if (minSpawnValue != null)
            minSpawnValue.text = $"{evt.newValue:F1}s";
    }

    void OnMaxSpawnChanged(ChangeEvent<float> evt)
    {
        if (maxSpawnValue != null)
            maxSpawnValue.text = $"{evt.newValue:F1}s";
    }

    void OnUseHandTrackingChanged(ChangeEvent<bool> evt)
    {
        UpdateHandTrackingControlStates();
    }

    void OnMovementSensitivityChanged(ChangeEvent<float> evt)
    {
        if (movementSensitivityValue != null)
        {
            movementSensitivityValue.text = $"{evt.newValue:F1}x";
        }
    }

    void OnNormalizeHandSizeChanged(ChangeEvent<bool> evt)
    {
        UpdateHandTrackingControlStates();
    }

    void OnHandSizeChanged(ChangeEvent<float> evt)
    {
        if (handSizeValue != null)
        {
            handSizeValue.text = $"{evt.newValue:F0}";
        }
    }

    void OnShowGrabCursorChanged(ChangeEvent<bool> evt)
    {
        UpdateHandTrackingControlStates();
    }

    void OnCursorSizeChanged(ChangeEvent<float> evt)
    {
        if (cursorSizeValue != null)
        {
            cursorSizeValue.text = $"{evt.newValue:F0}";
        }
    }

    void OnGrabThresholdChanged(ChangeEvent<float> evt)
    {
        if (grabThresholdValue != null)
        {
            grabThresholdValue.text = $"{evt.newValue:F2}";
        }
    }

    void OnJointSizeChanged(ChangeEvent<float> evt)
    {
        if (jointSizeValue != null)
        {
            jointSizeValue.text = $"{evt.newValue:F0}";
        }
    }

    void UpdateHandTrackingControlStates()
    {
        bool trackingEnabled = useHandTrackingToggle == null || useHandTrackingToggle.value;

        handIndexDropdown?.SetEnabled(trackingEnabled);
        movementSensitivitySlider?.SetEnabled(trackingEnabled);
        showHandSkeletonToggle?.SetEnabled(trackingEnabled);
        normalizeHandSizeToggle?.SetEnabled(trackingEnabled);
        showGrabCursorToggle?.SetEnabled(trackingEnabled);

        bool handSizeEnabled = trackingEnabled && (normalizeHandSizeToggle == null || normalizeHandSizeToggle.value);
        handSizeSlider?.SetEnabled(handSizeEnabled);

        bool cursorSizeEnabled = trackingEnabled && (showGrabCursorToggle == null || showGrabCursorToggle.value);
        cursorSizeSlider?.SetEnabled(cursorSizeEnabled);

        grabThresholdSlider?.SetEnabled(trackingEnabled);
        jointSizeSlider?.SetEnabled(trackingEnabled);
    }

    void OnTargetFishChanged(ChangeEvent<string> evt)
    {
        if (gameSettings == null) return;

        // Update the target fish mode immediately
        switch (evt.newValue)
        {
            case "Random (changes each catch)":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.Random;
                break;
            case "Fixed: Red":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedRed;
                break;
            case "Fixed: Blue":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedBlue;
                break;
            case "Fixed: Yellow":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedYellow;
                break;
            case "Fixed: Pink":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedPink;
                break;
            case "Fixed: Green":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedGreen;
                break;
        }

        // Update the target fish immediately in the game
        if (GameManager.Instance != null)
        {
            GameManager.Instance.SetRandomTargetFish();
        }
    }

    void OnSaveSettings()
    {
        if (gameSettings == null) return;

        gameSettings.speedMultiplier = speedSlider.value;
        gameSettings.minSpawnInterval = minSpawnSlider.value;
        gameSettings.maxSpawnInterval = maxSpawnSlider.value;
        gameSettings.spawnFrom = spawnDropdown.value == "Left" ?
            GameSettings.SpawnSide.Left : GameSettings.SpawnSide.Right;

        // Save target fish mode
        switch (targetFishDropdown.value)
        {
            case "Random (changes each catch)":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.Random;
                break;
            case "Fixed: Red":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedRed;
                break;
            case "Fixed: Blue":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedBlue;
                break;
            case "Fixed: Yellow":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedYellow;
                break;
            case "Fixed: Pink":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedPink;
                break;
            case "Fixed: Green":
                gameSettings.targetFishMode = GameSettings.TargetFishMode.FixedGreen;
                break;
        }

        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }

        if (handTrackingCatcher != null)
        {
            bool useTracking = useHandTrackingToggle == null || useHandTrackingToggle.value;
            int handIndex = ParseHandIndex();
            float sensitivity = movementSensitivitySlider != null ? movementSensitivitySlider.value : 1.5f;
            bool showSkeleton = showHandSkeletonToggle == null || showHandSkeletonToggle.value;
            bool normalizeSize = normalizeHandSizeToggle == null || normalizeHandSizeToggle.value;
            float size = handSizeSlider != null ? handSizeSlider.value : 5f;
            bool showCursor = showGrabCursorToggle == null || showGrabCursorToggle.value;
            float cursorSize = cursorSizeSlider != null ? cursorSizeSlider.value : 3f;
            float grabThreshold = grabThresholdSlider != null ? grabThresholdSlider.value : 0.6f;
            float jointSize = jointSizeSlider != null ? jointSizeSlider.value : 7f;

            handTrackingCatcher.ApplySettings(
                useTracking,
                handIndex,
                sensitivity,
                showSkeleton,
                normalizeSize,
                size,
                showCursor,
                cursorSize,
                grabThreshold,
                jointSize
            );
        }

        // Save settings directly to backend
        StartCoroutine(SaveSettingsToBackend());

        Debug.Log("Settings saved!");
        ShowSuccessNotification("Settings saved!");

        if (settingsPanel != null)
            settingsPanel.AddToClassList("hidden");

        // If opened from pause, show pause menu again after saving
        if (settingsOpenedFromPause && Time.timeScale == 0f)
        {
            settingsOpenedFromPause = false;
            ShowPauseMenu();
        }
        else if (!settingsOpenedFromPause)
        {
            ShowWelcomeView();
        }
    }

    IEnumerator SaveSettingsToBackend()
    {
        if (string.IsNullOrEmpty(GameSessionContext.userId))
        {
            Debug.LogError("Cannot save settings: userId is null");
            yield break;
        }

        string url = backendBaseUrl + "/game-settings?userId=" + GameSessionContext.userId +
            "&username=" + UnityWebRequest.EscapeURL(GameSessionContext.username ?? "");

        GameSettingsDTO dto = new GameSettingsDTO
        {
            speedMultiplier = gameSettings.speedMultiplier,
            minSpawnInterval = gameSettings.minSpawnInterval,
            maxSpawnInterval = gameSettings.maxSpawnInterval,
            spawnFrom = gameSettings.spawnFrom.ToString(),
            targetFishMode = gameSettings.targetFishMode.ToString(),
            useHandTracking = useHandTrackingToggle == null || useHandTrackingToggle.value,
            handIndexToUse = ParseHandIndex(),
            movementSensitivity = movementSensitivitySlider != null ? movementSensitivitySlider.value : 1.5f,
            showHandSkeleton = showHandSkeletonToggle == null || showHandSkeletonToggle.value,
            normalizeHandSize = normalizeHandSizeToggle == null || normalizeHandSizeToggle.value,
            handSize = handSizeSlider != null ? handSizeSlider.value : 5f,
            showGrabCursor = showGrabCursorToggle == null || showGrabCursorToggle.value,
            cursorSize = cursorSizeSlider != null ? cursorSizeSlider.value : 3f,
            grabThreshold = grabThresholdSlider != null ? grabThresholdSlider.value : 0.6f,
            jointSize = jointSizeSlider != null ? jointSizeSlider.value : 7f
        };

        string json = JsonUtility.ToJson(dto);
        Debug.Log("Saving settings to backend: " + json);

        using UnityWebRequest req = new UnityWebRequest(url, "POST");
        req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");

        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError("Failed to save settings to backend: " + req.error);
        }
        else
        {
            Debug.Log("Settings saved to backend successfully!");
        }
    }

    void OnCloseSettings()
    {
        if (settingsPanel != null)
            settingsPanel.AddToClassList("hidden");

        // If opened from pause, show pause menu again
        if (settingsOpenedFromPause && Time.timeScale == 0f)
        {
            settingsOpenedFromPause = false;
            ShowPauseMenu();
        }
        // Otherwise return to welcome view
        else if (!settingsOpenedFromPause)
        {
            ShowWelcomeView();
        }
    }

    int ParseHandIndex()
    {
        if (handIndexDropdown == null || string.IsNullOrEmpty(handIndexDropdown.value))
        {
            return 0;
        }

        if (int.TryParse(handIndexDropdown.value, out int value))
        {
            return Mathf.Max(0, value);
        }

        return 0;
    }

    // --------------------------------------------------
    // PAUSE MENU (PUBLIC - Called from PauseMenuController)
    // --------------------------------------------------
    public void ShowPauseMenu()
    {
        // Pause menu is now outside overlay, so game remains visible in background
        // The pause menu has its own semi-transparent overlay (pause-overlay class)
        if (pauseMenu == null && uiDocument != null)
            pauseMenu = uiDocument.rootVisualElement?.Q<VisualElement>("pauseMenu");

        if (pauseMenu == null)
        {
            Debug.LogError("Login.ShowPauseMenu: 'pauseMenu' VisualElement not found (check login.uxml name='pauseMenu').");
            return;
        }

        pauseMenu.RemoveFromClassList("hidden");
    }

    public void HidePauseMenu()
    {
        if (pauseMenu == null && uiDocument != null)
            pauseMenu = uiDocument.rootVisualElement?.Q<VisualElement>("pauseMenu");

        pauseMenu?.AddToClassList("hidden");
        HideSuccessNotification(); // Hide success notification when closing pause menu
    }

    public bool IsSettingsOpen()
    {
        return settingsPanel != null && !settingsPanel.ClassListContains("hidden");
    }

    public void CloseSettings()
    {
        OnCloseSettings();
    }

    void OnContinue()
    {
        // Find PauseMenuController and call Resume to sync state
        PauseMenuController pauseController = FindFirstObjectByType<PauseMenuController>();
        if (pauseController != null)
        {
            pauseController.Resume();
        }
        else
        {
            // Fallback if no controller found
            HidePauseMenu();
            Time.timeScale = 1f;
        }
    }

    void OnPauseSettingsClicked()
    {
        // Hide pause menu when opening settings from pause
        if (pauseMenu == null && uiDocument != null)
            pauseMenu = uiDocument.rootVisualElement?.Q<VisualElement>("pauseMenu");

        if (pauseMenu != null)
            pauseMenu.AddToClassList("hidden");

        // Ensure only settings UI is visible - settings is now outside overlay
        if (loginView != null) loginView.AddToClassList("hidden");
        if (registerView != null) registerView.AddToClassList("hidden");
        if (welcomeView != null) welcomeView.AddToClassList("hidden");

        settingsOpenedFromPause = true;
        LoadSettingsToUI();

        if (settingsPanel != null)
            settingsPanel.RemoveFromClassList("hidden");
    }

    void OnSaveAndEnd()
    {
        if (SessionStats.Instance != null)
            SessionStats.Instance.EndSession();

        SessionUploader uploader = FindFirstObjectByType<SessionUploader>();
        if (uploader != null)
            uploader.UploadSessionData();

        HidePauseMenu();
        Time.timeScale = 1f;
        ReturnToWelcome();
    }

    void OnReturnToMenu()
    {
        // End current session without uploading (user chose to return)
        if (SessionStats.Instance != null)
            SessionStats.Instance.EndSession();

        Time.timeScale = 1f;
        HidePauseMenu();
        ReturnToWelcome();
    }

    void OnQuitGame()
    {
        Debug.Log("Quitting game...");
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit();
#endif
    }

    // --------------------------------------------------
    // RETURN TO WELCOME (from pause or external)
    // --------------------------------------------------
    public void ReturnToWelcome()
    {
        // Stop polling when returning to menu
        GameSettingsManager settingsManager = FindFirstObjectByType<GameSettingsManager>();
        settingsManager?.StopPolling();

        // Stop hand tracking runner when leaving gameplay
        var handRunner = FindFirstObjectByType<GameHandLandmarkerRunner>();
        handRunner?.Stop();

        // Stop fish spawning before hiding game
        FishSpawner fishSpawner = FindFirstObjectByType<FishSpawner>();
        if (fishSpawner != null)
            fishSpawner.StopSpawning();

        if (gameRoot != null)
            gameRoot.SetActive(false);

        var overlay = uiDocument.rootVisualElement.Q<VisualElement>("overlay");
        if (overlay != null)
            overlay.style.display = DisplayStyle.Flex;

        ShowWelcomeView();
    }
}
