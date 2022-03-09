// import {Resolution} from './types'
// const Resolution = require("./types.ts");
let outputResolution = { width: 1920, height: 1080 };
function getTemplateSizeAndAnchors(screenStyle) {
	let templateSizes;
	let anchors;
	let screenWidth = outputResolution.width;
	let screenHeight = outputResolution.height;

	switch (screenStyle) {
		case "....":
			templateSizes = Array(4).fill({
				x: screenWidth / 2,
				y: screenHeight / 2,
			});

			anchors = [
				{ x: 0, y: 0 },
				{ x: screenWidth / 2, y: 0 },
				{ x: 0, y: screenHeight / 2 },
				{ x: screenWidth / 2, y: screenHeight / 2 },
			];
			break;

		case "|..":
			templateSizes = [
				{ x: screenWidth / 2, y: screenHeight },
				{ x: screenWidth / 2, y: screenHeight / 2 },
				{ x: screenWidth / 2, y: screenHeight / 2 },
			];

			anchors = [
				{ x: 0, y: 0 },
				{ x: screenWidth / 2, y: 0 },
				{ x: screenWidth / 2, y: screenHeight / 2 },
			];
			break;

		case "_..":
			templateSizes = [
				{ x: screenWidth, y: screenHeight / 2 },
				{ x: screenWidth / 2, y: screenHeight / 2 },
				{ x: screenWidth / 2, y: screenHeight / 2 },
			];

			anchors = [
				{ x: 0, y: 0 },
				{ x: 0, y: screenHeight / 2 },
				{ x: screenWidth / 2, y: screenHeight / 2 },
			];
			break;

		default:
			throw Error("Fuck you: invalid screenstyle");
	}
	return { anchors, templateSizes };
}

function calculateLayout(videoInput, screenStyle) {
	if (videoInput.files.length !== screenStyle.length) {
		throw Error("Incorrect number of videos supplied");
	}
	let video_resolutions = videoInput.resolution;
	let template_data = getTemplateSizeAndAnchors(screenStyle);
	let video_anchors = template_data.anchors;
	let real_resolutions = [];

	for (let i = 0; i < videoInput.files.length; i++) {
		let res = video_resolutions[i];
		let res_ratio = Math.max(
			res.width / template_data.templateSizes[i].x,
			res.height / template_data.templateSizes[i].y
		);
		real_resolutions.push({
			width: res.width / res_ratio,
			height: res.height / res_ratio,
		});
	}
	console.log(video_anchors);
	console.log(template_data.templateSizes);
	console.log(real_resolutions);
}

let testVideos = {
	files: ["a", "b", "c"],
	resolution: Array(3).fill({ width: 1280, height: 720 }),
	crop_offsets: [
		{ width: 0, height: 0 },
		{ width: 0, height: 0 },
		{ width: 0, height: 0 },
	],
	zoom_levels: [1.5, 1, 2],
};

let result = calculateLayout(testVideos, "_..");
console.log(result);

function calculateLayoutPositions(resolutions, screenStyle) {
	if (resolutions.length !== screenStyle.length) {
		throw Error("Incorrect number of videos supplied");
	}

	let templateData = getTemplateSizeAndAnchors(screenStyle);
	let resizeData = templateData.anchors;
	let templateSizes = templateData.templateSizes;

	for (let i = 0; i < resolutions.length; i++) {
		let res = resolutions[i];
		let xRatio = res.width / templateSizes[i].x,
			yRatio = res.height / templateSizes[i].y;
		resizeData[i].resizeRatio = xRatio > yRatio ? 1 / xRatio : 1 / yRatio;
	}

	return resizeData;
}
