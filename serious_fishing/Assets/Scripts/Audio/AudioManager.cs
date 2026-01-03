using UnityEngine;

public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    [Header("Audio Sources")]
    [SerializeField] private AudioSource musicSource;
    [SerializeField] private AudioSource sfxSource;
    [SerializeField] private AudioSource menuSource;
    [SerializeField] private AudioSource vfxSource;

    [Header("Audio Clips")]
    [SerializeField] private AudioClip backgroundMusic;
    [SerializeField] private AudioClip correctFishClip;
    [SerializeField] private AudioClip wrongFishClip;
    [SerializeField] private AudioClip menuClickClip;
    [SerializeField] private AudioClip vfxClip;

    [Header("Volumes")]
    [Range(0f, 1f)] [SerializeField] private float musicVolume = 0.6f;
    [Range(0f, 1f)] [SerializeField] private float correctFishVolume = 1f;
    [Range(0f, 1f)] [SerializeField] private float wrongFishVolume = 1f;
    [Range(0f, 1f)] [SerializeField] private float menuVolume = 0.8f;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        ConfigureSources();
    }

    void Start()
    {
        ApplyVolumes();
        StartMusicIfNeeded();
    }

    void ConfigureSources()
    {
        if (musicSource == null) musicSource = gameObject.AddComponent<AudioSource>();
        if (sfxSource == null) sfxSource = gameObject.AddComponent<AudioSource>();
        if (menuSource == null) menuSource = gameObject.AddComponent<AudioSource>();
        if (vfxSource == null) vfxSource = gameObject.AddComponent<AudioSource>();

        musicSource.loop = true;
        musicSource.playOnAwake = false;
        sfxSource.playOnAwake = false;
        menuSource.playOnAwake = false;
        vfxSource.playOnAwake = false;
    }

    void StartMusicIfNeeded()
    {
        if (backgroundMusic == null)
        {
            return;
        }

        if (musicSource.clip != backgroundMusic)
        {
            musicSource.clip = backgroundMusic;
        }

        if (!musicSource.isPlaying)
        {
            musicSource.Play();
        }
    }

    public void ApplyVolumeSettings(
        float newMusicVolume,
        float newCorrectVolume,
        float newWrongVolume,
        float newMenuVolume
    )
    {
        musicVolume = Mathf.Clamp01(newMusicVolume);
        correctFishVolume = Mathf.Clamp01(newCorrectVolume);
        wrongFishVolume = Mathf.Clamp01(newWrongVolume);
        menuVolume = Mathf.Clamp01(newMenuVolume);

        ApplyVolumes();
    }

    void ApplyVolumes()
    {
        musicSource.volume = musicVolume;
    }

    public void PlayCorrectFish()
    {
        if (correctFishClip != null)
        {
            sfxSource.PlayOneShot(correctFishClip, correctFishVolume);
        }
    }

    public void PlayWrongFish()
    {
        if (wrongFishClip != null)
        {
            sfxSource.PlayOneShot(wrongFishClip, wrongFishVolume);
        }
    }

    public void PlayMenuClick()
    {
        if (menuClickClip != null)
        {
            menuSource.PlayOneShot(menuClickClip, menuVolume);
        }
    }

    public void PlayVfx()
    {
        if (vfxClip != null)
        {
            vfxSource.PlayOneShot(vfxClip, 1f);
        }
    }

    public float GetMusicVolume() => musicVolume;
    public float GetCorrectFishVolume() => correctFishVolume;
    public float GetWrongFishVolume() => wrongFishVolume;
    public float GetMenuVolume() => menuVolume;
}
