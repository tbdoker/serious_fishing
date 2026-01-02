using UnityEngine;

[RequireComponent(typeof(LineRenderer))]
public class ZoneGridRenderer : MonoBehaviour
{
    public float lineWidth = 0.2f;
    private LineRenderer lineRenderer;
    private Camera cam;

    void Start()
    {
        cam = Camera.main;
        lineRenderer = GetComponent<LineRenderer>();
        lineRenderer.widthMultiplier = lineWidth;
        lineRenderer.positionCount = 8; // 4 lines = 8 points (2 per line)
        lineRenderer.useWorldSpace = true;
        lineRenderer.loop = false;
        lineRenderer.material = new Material(Shader.Find("Sprites/Default"));
        lineRenderer.startColor = Color.green;
        lineRenderer.endColor = Color.green;

        DrawGrid();
    }

    void DrawGrid()
    {
        float height = cam.orthographicSize * 2f;
        float width = height * cam.aspect;

        float left = cam.transform.position.x - (width / 2f);
        float right = cam.transform.position.x + (width / 2f);
        float top = cam.transform.position.y + (height / 2f);
        float bottom = cam.transform.position.y - (height / 2f);

        float thirdWidth = width / 3f;
        float thirdHeight = height / 3f;

        Vector3[] lines = new Vector3[8];

        // Vertical lines (x varies, y constant)
        lines[0] = new Vector3(left + thirdWidth, bottom, 0f);
        lines[1] = new Vector3(left + thirdWidth, top, 0f);

        lines[2] = new Vector3(left + 2 * thirdWidth, bottom, 0f);
        lines[3] = new Vector3(left + 2 * thirdWidth, top, 0f);

        // Horizontal lines (y varies, x constant)
        lines[4] = new Vector3(left, bottom + thirdHeight, 0f);
        lines[5] = new Vector3(right, bottom + thirdHeight, 0f);

        lines[6] = new Vector3(left, bottom + 2 * thirdHeight, 0f);
        lines[7] = new Vector3(right, bottom + 2 * thirdHeight, 0f);

        lineRenderer.positionCount = lines.Length;
        lineRenderer.SetPositions(lines);
    }
}
