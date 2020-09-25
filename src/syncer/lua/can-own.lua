local lock_key = KEYS[1]
local chat_id = ARGV[1]
local expires = ARGV[2]

local locked = redis.call('get', lock_key)

if (locked == nil) then
  -- There is no lock, so we could own the lock
  return 'YES'
end

if (locked == chat_id) then
  return 'YES'
end

return 'NO'
