#!/usr/bin/env bash
# Resumable render: renders the composition in fixed-size frame chunks
# (out/chunks/part-XXXX.mp4), skipping chunks that already exist, then joins
# them losslessly into out/bedroom_walkthrough.mp4. Safe to re-run after an
# interruption — finished chunks are kept.
#   CHUNK=120 CONCURRENCY=50% bash scripts/render-chunks.sh
set -euo pipefail
cd "$(dirname "$0")/.."

TOTAL=960
CHUNK=${CHUNK:-120}
CONCURRENCY=${CONCURRENCY:-50%}
mkdir -p out/chunks
: > out/chunks/list.txt

for ((start = 0; start < TOTAL; start += CHUNK)); do
	end=$((start + CHUNK - 1))
	((end >= TOTAL)) && end=$((TOTAL - 1))
	part=$(printf "out/chunks/part-%04d.mp4" "$start")
	if [[ ! -s "$part" ]]; then
		echo "rendering frames $start-$end → $part"
		npx remotion render BedroomWalkthrough "$part.tmp.mp4" \
			--frames="$start-$end" --codec=h264 --crf=18 --gl=angle \
			--concurrency="$CONCURRENCY" --log=error
		mv "$part.tmp.mp4" "$part"
	else
		echo "skip $part (done)"
	fi
	echo "file '$(basename "$part")'" >> out/chunks/list.txt
done

npx remotion ffmpeg -y -hide_banner -loglevel error \
	-f concat -safe 0 -i out/chunks/list.txt -c copy -movflags +faststart \
	out/bedroom_walkthrough.mp4
echo "done → out/bedroom_walkthrough.mp4"
