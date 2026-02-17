# Video Pipeline (Asynchronous + Accessible)

This site does not depend on live classes. Video references are optional and must be accessible.

## Source of Truth
- Manifest: `data/video-library.json`
- Validation: `python3 scripts/check_video_pipeline.py`

## Required Metadata Per Video
- `id`, `title`, `module`
- `url` (absolute)
- `captions_checked: true`
- `transcript_status` (`youtube_transcript`, `publisher_transcript`, `local_transcript`, `none`)
- `transcript_url` when transcript exists
- `fallback_reading` (paper/brief/PDF)

## Operational Workflow
1. Add video entry to `data/video-library.json`.
2. Verify captions manually in player.
3. Confirm transcript path (YouTube transcript pane, publisher transcript, or local transcript file).
4. Add fallback reading link for accessibility and low-bandwidth users.
5. Run release gate before deploy.

## Deployment Rule
- If caption/transcript metadata is missing, release gate fails.
- Optional references can be published only when fallback reading is present.
