-- Made-up data for the end-to-end tests.
INSERT INTO user (email, name) VALUES ('alex@example.com', 'Alex'), ('sam@example.com', 'Sam');
INSERT INTO score (user_id, height, perfects, at) VALUES
	(2, 42, 11, '2026-11-01T18:00:00.000Z'),
	(1, 17, 3, '2026-11-02T18:00:00.000Z');
