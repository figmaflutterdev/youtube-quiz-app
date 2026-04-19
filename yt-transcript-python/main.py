from youtube_transcript_api import YouTubeTranscriptApi


def get_from_api(video_id):
    return YouTubeTranscriptApi.get_transcript(video_id)

import subprocess

def get_from_ytdlp(url):
    cmd = [
        "yt-dlp",
        "--write-auto-sub",
        "--skip-download",
        "--sub-lang", "en",
        url
    ]
    subprocess.run(cmd)
    return "subtitle file generated"