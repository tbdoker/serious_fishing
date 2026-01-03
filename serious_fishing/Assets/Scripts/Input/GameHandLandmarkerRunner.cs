// Modified HandLandmarkerRunner for the Fishing Game
// Based on MediaPipe Unity Plugin sample

using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Events;
using Mediapipe;
using Mediapipe.Tasks.Vision.Core;
using Mediapipe.Tasks.Vision.HandLandmarker;
using Mediapipe.Unity;
using Mediapipe.Unity.Experimental;
using Mediapipe.Unity.Sample;
using Mediapipe.Unity.Sample.HandLandmarkDetection;

public class GameHandLandmarkerRunner : VisionTaskApiRunner<HandLandmarker>
{
    [Header("Annotation (Optional)")]
    [SerializeField] private HandLandmarkerResultAnnotationController _handLandmarkerResultAnnotationController;

    [Header("Game Integration")]
    [SerializeField] private HandTrackingCatcher handTrackingCatcher;

    [Header("Events")]
    public UnityEvent<HandLandmarkerResult> OnHandLandmarkDetected;

    private TextureFramePool _textureFramePool;

    public readonly HandLandmarkDetectionConfig config = new HandLandmarkDetectionConfig();

    void Awake()
    {
        // Auto-find HandTrackingCatcher if not assigned
        if (handTrackingCatcher == null)
        {
            handTrackingCatcher = FindFirstObjectByType<HandTrackingCatcher>();
        }
    }

    public override void Stop()
    {
        base.Stop();
        _textureFramePool?.Dispose();
        _textureFramePool = null;
    }

    protected override IEnumerator Run()
    {
        Debug.Log($"[GameHandLandmarker] Starting with:");
        Debug.Log($"  Delegate = {config.Delegate}");
        Debug.Log($"  Running Mode = {config.RunningMode}");
        Debug.Log($"  NumHands = {config.NumHands}");

        yield return AssetLoader.PrepareAssetAsync(config.ModelPath);

        var options = config.GetHandLandmarkerOptions(
            config.RunningMode == Mediapipe.Tasks.Vision.Core.RunningMode.LIVE_STREAM
                ? OnHandLandmarkDetectionOutput
                : null
        );

        taskApi = HandLandmarker.CreateFromOptions(options, GpuManager.GpuResources);
        var imageSource = ImageSourceProvider.ImageSource;

        yield return imageSource.Play();

        if (!imageSource.isPrepared)
        {
            Debug.LogError("[GameHandLandmarker] Failed to start ImageSource");
            yield break;
        }

        _textureFramePool = new TextureFramePool(
            imageSource.textureWidth,
            imageSource.textureHeight,
            TextureFormat.RGBA32,
            10
        );

        // Only initialize screen if it's assigned and has a valid RawImage
        if (screen != null)
        {
            try
            {
                screen.Initialize(imageSource);
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"[GameHandLandmarker] Screen initialization skipped (no RawImage assigned): {e.Message}");
            }
        }

        if (_handLandmarkerResultAnnotationController != null)
        {
            SetupAnnotationController(_handLandmarkerResultAnnotationController, imageSource);
        }

        var transformationOptions = imageSource.GetTransformationOptions();
        var flipHorizontally = transformationOptions.flipHorizontally;
        var flipVertically = transformationOptions.flipVertically;
        var imageProcessingOptions = new ImageProcessingOptions(
            rotationDegrees: (int)transformationOptions.rotationAngle
        );

        AsyncGPUReadbackRequest req = default;
        var waitUntilReqDone = new WaitUntil(() => req.done);
        var waitForEndOfFrame = new WaitForEndOfFrame();
        var result = HandLandmarkerResult.Alloc(options.numHands);

        var canUseGpuImage = SystemInfo.graphicsDeviceType == GraphicsDeviceType.OpenGLES3 && GpuManager.GpuResources != null;
        using var glContext = canUseGpuImage ? GpuManager.GetGlContext() : null;

        Debug.Log("[GameHandLandmarker] Hand tracking started!");

        while (true)
        {
            if (isPaused)
            {
                yield return new WaitWhile(() => isPaused);
            }

            if (!_textureFramePool.TryGetTextureFrame(out var textureFrame))
            {
                yield return waitForEndOfFrame;
                continue;
            }

            // Build the input Image
            Image image;
            switch (config.ImageReadMode)
            {
                case ImageReadMode.GPU:
                    if (!canUseGpuImage)
                    {
                        throw new System.Exception("ImageReadMode.GPU is not supported");
                    }
                    textureFrame.ReadTextureOnGPU(imageSource.GetCurrentTexture(), flipHorizontally, flipVertically);
                    image = textureFrame.BuildGPUImage(glContext);
                    yield return waitForEndOfFrame;
                    break;
                case ImageReadMode.CPU:
                    yield return waitForEndOfFrame;
                    textureFrame.ReadTextureOnCPU(imageSource.GetCurrentTexture(), flipHorizontally, flipVertically);
                    image = textureFrame.BuildCPUImage();
                    textureFrame.Release();
                    break;
                case ImageReadMode.CPUAsync:
                default:
                    req = textureFrame.ReadTextureAsync(imageSource.GetCurrentTexture(), flipHorizontally, flipVertically);
                    yield return waitUntilReqDone;

                    if (req.hasError)
                    {
                        Debug.LogWarning("[GameHandLandmarker] Failed to read texture");
                        continue;
                    }
                    image = textureFrame.BuildCPUImage();
                    textureFrame.Release();
                    break;
            }

            switch (taskApi.runningMode)
            {
                case Mediapipe.Tasks.Vision.Core.RunningMode.IMAGE:
                    if (taskApi.TryDetect(image, imageProcessingOptions, ref result))
                    {
                        ProcessResult(result);
                    }
                    else
                    {
                        ProcessResult(default);
                    }
                    break;
                case Mediapipe.Tasks.Vision.Core.RunningMode.VIDEO:
                    if (taskApi.TryDetectForVideo(image, GetCurrentTimestampMillisec(), imageProcessingOptions, ref result))
                    {
                        ProcessResult(result);
                    }
                    else
                    {
                        ProcessResult(default);
                    }
                    break;
                case Mediapipe.Tasks.Vision.Core.RunningMode.LIVE_STREAM:
                    taskApi.DetectAsync(image, GetCurrentTimestampMillisec(), imageProcessingOptions);
                    break;
            }
        }
    }

    private void OnHandLandmarkDetectionOutput(HandLandmarkerResult result, Image image, long timestamp)
    {
        ProcessResult(result);
    }

    private void ProcessResult(HandLandmarkerResult result)
    {
        // Update annotation visualization (optional)
        if (_handLandmarkerResultAnnotationController != null)
        {
            _handLandmarkerResultAnnotationController.DrawLater(result);
        }

        // Send to game's hand tracking catcher
        if (handTrackingCatcher != null)
        {
            handTrackingCatcher.UpdateHandLandmarks(result);
        }

        // Fire event for any other listeners
        OnHandLandmarkDetected?.Invoke(result);
    }
}
