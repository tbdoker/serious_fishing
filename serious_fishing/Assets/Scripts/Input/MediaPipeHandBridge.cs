using UnityEngine;
using Mediapipe.Tasks.Vision.HandLandmarker;
using Mediapipe.Unity.Sample.HandLandmarkDetection;

/// <summary>
/// Bridges MediaPipe hand tracking with the fish catching game.
/// Attach this to a GameObject in your game scene along with HandTrackingCatcher.
/// </summary>
public class MediaPipeHandBridge : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private HandTrackingCatcher handTrackingCatcher;
    [SerializeField] private HandLandmarkerRunner handLandmarkerRunner;

    [Header("Settings")]
    [SerializeField] private bool autoFindReferences = true;

    void Start()
    {
        if (autoFindReferences)
        {
            if (handTrackingCatcher == null)
            {
                handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
            }

            if (handLandmarkerRunner == null)
            {
                handLandmarkerRunner = FindFirstObjectByType<HandLandmarkerRunner>();
            }
        }

        if (handLandmarkerRunner == null)
        {
            Debug.LogWarning("MediaPipeHandBridge: HandLandmarkerRunner not found. Hand tracking disabled.");
        }

        if (handTrackingCatcher == null)
        {
            Debug.LogError("MediaPipeHandBridge: HandTrackingCatcher not found!");
        }
    }

    void Update()
    {
        if (handLandmarkerRunner == null || handTrackingCatcher == null)
        {
            return;
        }

        // Get the latest hand landmark result from MediaPipe
        // Note: You may need to modify HandLandmarkerRunner to expose the result
        // or use the callback approach shown below
    }

    /// <summary>
    /// Call this method from HandLandmarkerRunner's callback when new results are available.
    /// Modify HandLandmarkerRunner.OnHandLandmarkDetectionOutput to call this.
    /// </summary>
    public void OnHandLandmarkResult(HandLandmarkerResult result)
    {
        if (handTrackingCatcher != null)
        {
            handTrackingCatcher.UpdateHandLandmarks(result);
        }
    }
}
