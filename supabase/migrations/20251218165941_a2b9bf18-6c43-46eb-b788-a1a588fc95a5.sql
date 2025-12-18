
-- Force update timestamps for specific empty conversations to move them to bottom
UPDATE conversations 
SET updated_at = '2020-01-01 00:00:00+00'
WHERE id IN (
  '3be28c39-09f5-4c02-b3d2-2966ee41c2d5',
  '9a2212c3-255d-4506-8cc1-dc57a2477f71',
  'a3bb3262-8674-423c-bb82-fdd6816e2caa',
  '24843f36-452d-4079-ae6d-ea084af6a34f',
  'f52a9f7b-4d13-4946-b23b-55192077ca11',
  '43fda5b3-77d1-4aea-a7d5-092439e1416c',
  '0eab9d49-295b-4cd5-9c07-7bf9270576b4',
  'd9665dda-4ed4-4793-a36e-6816d16358da',
  'bb6617de-d5f4-4602-8465-41ccb2c8cf6a',
  '5ac2e50c-4043-4d2f-88d9-09dc7497ba89',
  'cdf3e508-a7db-493f-8cdb-12f3500f05c8'
);
