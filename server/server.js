import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_MAPS_API_KEY) {
	console.warn('GOOGLE_MAPS_API_KEY is not set. /api/nearby-hospitals will fail.');
}

app.get('/api/nearby-hospitals', async (req, res) => {
	try {
		const { lat, lon, keyword } = req.query;
		if (!lat || !lon) {
			return res.status(400).json({ error: 'lat and lon are required' });
		}

		const params = new URLSearchParams({
			location: `${lat},${lon}`,
			radius: '5000',
			type: 'hospital',
			key: GOOGLE_MAPS_API_KEY || ''
		});
		if (keyword && typeof keyword === 'string') {
			params.set('keyword', keyword);
		}
		const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
		const mapsResp = await axios.get(url);
		return res.json(mapsResp.data);
	} catch (err) {
		console.error('Error in /api/nearby-hospitals', err);
		return res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
	}
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
	console.log(`API server listening on http://localhost:${port}`);
});


