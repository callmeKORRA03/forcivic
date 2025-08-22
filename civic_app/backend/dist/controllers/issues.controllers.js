"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssues = exports.createIssue = void 0;
const issue_model_1 = require("../models/issue.model");
const multimedia_model_1 = require("../models/multimedia.model");
/**
 * Create a new issue, optionally storing uploaded media entries.
 */
const createIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // multer files (may be undefined)
        const files = (_a = req.files) !== null && _a !== void 0 ? _a : [];
        const { title, description, location, issueType } = req.body;
        // Parse location if provided as JSON string
        let parsedLocation = location;
        if (typeof location === "string") {
            try {
                parsedLocation = JSON.parse(location);
            }
            catch (_b) {
                res.status(400).json({ message: "Invalid location JSON format" });
                return;
            }
        }
        // Validate required fields
        if (!title ||
            !description ||
            !parsedLocation ||
            !parsedLocation.latitude ||
            !parsedLocation.longitude ||
            !parsedLocation.address ||
            !issueType) {
            res.status(400).json({ message: "Please fill all the required fields" });
            return;
        }
        // Prevent duplicate title
        const existingIssue = yield issue_model_1.IssueModel.findOne({ title }).exec();
        if (existingIssue) {
            res.status(400).json({ message: "Issue with this title already exists" });
            return;
        }
        // Create the issue (cast to IssueDoc for typing)
        const created = yield issue_model_1.IssueModel.create({
            citizenId: req.citizenId,
            issueType,
            title,
            description,
            location: parsedLocation,
            status: "Reported",
            media: [],
        });
        const issue = created;
        // If there are uploaded files, create multimedia docs
        let mediaDocs = [];
        if (files.length > 0) {
            // map and create each media entry, awaiting them in parallel
            const createdMedia = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const md = yield multimedia_model_1.MultimediaModel.create({
                    issueID: issue._id,
                    fileType: file.mimetype.startsWith("video") ? "video" : "image",
                    url: file.path,
                    filename: file.originalname,
                });
                // Cast to MultimediaDoc
                return md;
            })));
            mediaDocs = createdMedia;
            // Update issue with references to media object ids
            const mediaIds = mediaDocs.map((d) => d._id);
            yield issue_model_1.IssueModel.findByIdAndUpdate(issue._id, { media: mediaIds }).exec();
        }
        res.status(201).json({
            message: "Issue created successfully",
            issue,
            media: mediaDocs,
        });
    }
    catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createIssue = createIssue;
/**
 * Fetch all issues (simple projection + media thumbnail selection)
 */
const getIssues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use .lean() so we get plain objects (faster and easier to type as any[])
        const issues = (yield issue_model_1.IssueModel.find({})
            .populate("citizenId", "fullName")
            .populate("media")
            .lean());
        // Build presentation objects
        const issuesWithMedia = issues.map((issue) => {
            var _a;
            // media may be an array of docs when populated
            const mediaArr = Array.isArray(issue.media) ? issue.media : [];
            const firstMedia = mediaArr.length > 0 ? mediaArr[0] : null;
            return {
                _id: issue._id,
                title: issue.title,
                description: issue.description,
                type: issue.issueType,
                location: issue.location,
                reportedBy: ((_a = issue.citizenId) === null || _a === void 0 ? void 0 : _a.fullName) || "Anonymous",
                reportedAt: issue.createdAt,
                image: firstMedia ? firstMedia.url : null,
                status: issue.status,
            };
        });
        res.json({ issues: issuesWithMedia });
    }
    catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
});
exports.getIssues = getIssues;
