-- Profile photos are not collected or stored. The frontend uses a fixed,
-- generic account icon instead.
ALTER TABLE "user" DROP COLUMN image;
