@echo off
echo Starting local MongoDB instance on port 27017...
if not exist "D:\discordx\data\db" mkdir "D:\discordx\data\db"
"C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" --dbpath "D:\discordx\data\db" --port 27017
pause
