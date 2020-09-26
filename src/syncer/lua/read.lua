local lock_key = KEYS[1]
local store_key = KEYS[2]
local chat_id = ARGV[1]

local locked = redis.call('get', lock_key)

if (not locked or locked == chat_id) then
  -- There is no lock, so we could own the lock
  return {
    'OK',
    redis.call('get', store_key) or '{}'
  }
end

return {
  'NOT_OK',
  nil
}
