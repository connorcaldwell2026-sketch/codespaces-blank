import axios from 'axios';
import PatternAnalysis from '../models/PatternAnalysis.js';
import Report from '../models/Report.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/complete';

const callClaude = async (prompt) => {
  const response = await axios.post(CLAUDE_ENDPOINT, {
    model: 'claude-sonnet-4-6',
    prompt: `\nHuman: ${prompt}\n\nAssistant:`,
    max_tokens_to_sample: 400,
    temperature: 0.2,
    stop_sequences: ['\nHuman:']
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ANTHROPIC_API_KEY
    }
  });
  return response.data.completion;
};

export const classifyIncident = async (description) => {
  const prompt = `Read this incident description and return JSON with suggestedCrimeType, severityScore (1-10), suggestedTags, isFalseReportRisk, confidence. Description: ${description}`;
  const completion = await callClaude(prompt);
  const jsonMatch = completion.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return JSON');
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
};

export const smartSearch = async (query, regionId) => {
  const prompt = `Convert the natural language query into MongoDB filter JSON with crimeType, dateRange, radiusKm, centerPoint and regionId. Query: ${query}`;
  const completion = await callClaude(prompt);
  const jsonMatch = completion.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Smart search did not return JSON');
  const filter = JSON.parse(jsonMatch[0]);
  filter.regionId = regionId || filter.regionId || process.env.REGION_DEFAULT || 'default';
  return filter;
};

export const summarizeReport = async (text, imageDescription) => {
  const prompt = `Summarize the following incident description and image details into two plain-language sentences for quick police triage. Description: ${text}. Image details: ${imageDescription || 'none'}.`;
  const completion = await callClaude(prompt);
  return { summary: completion.trim() };
};

export const analyzePatterns = async (regionId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const reports = await Report.find({ regionId, verified: true, createdAt: { $gte: thirtyDaysAgo } }).lean();
  const prompt = `Analyze these crime reports. Identify: top 3 emerging hotspots, most common crime type by time of day, any escalation patterns, and recommended patrol focus areas. Return structured JSON. Reports: ${JSON.stringify(reports)}`;
  const completion = await callClaude(prompt);
  const jsonMatch = completion.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Pattern analysis did not return JSON');
  const briefing = JSON.parse(jsonMatch[0]);
  const analysis = await PatternAnalysis.create({
    regionId,
    briefing,
    hotspots: briefing.hotspots || [],
    recommendations: briefing.recommendations || []
  });
  return analysis;
};

export default {
  classifyIncident,
  smartSearch,
  summarizeReport,
  analyzePatterns
};
