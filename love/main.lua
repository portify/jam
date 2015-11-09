local source, events, powers, hits

function love.load()
  source = love.audio.newSource("guitar.mp3")
  source:play()

  events = dofile("NOTES.mid.lua")

  powers = {0, 0, 0, 0, 0}
  hits = {}
end

function love.update(dt)
  for i=1, 5 do
    powers[i] = math.max(0, powers[i] - dt)
  end
end

local function get_lane_x(i)
  return love.graphics.getWidth() / 2 - (32 * 5) / 2 + (i - 1) * 32
end

function love.draw()
  local time = source:tell()

  local lanes = {
    [96]  = 1,
    [97]  = 2,
    [98]  = 3,
    [99]  = 4,
    [100] = 5,
  }

  local colors = {
    {  0, 255,   0},
    {255,   0,   0},
    {255, 255,   0},
    {  0,   0, 255},
    {255, 127,   0},
  }

  love.graphics.setLineWidth(2)
  local n = 0

  for i=1, 5 do
    local x = get_lane_x(i)

    love.graphics.setColor(colors[i][1], colors[i][2], colors[i][3], 127)
    love.graphics.line(x, 0, x, love.graphics.getHeight())
  end

  love.graphics.setLineWidth(16)

  for i, event in ipairs(events) do
    if event.event == "on" and lanes[event.a] then
      -- find off
      local duration = 75

      for j=i+1, #events do
        if events[j].event == "off" and events[j].a == event.a then
          duration = events[j].time - event.time
          break
        end
      end

      local lane = lanes[event.a]

      local t1 = event.time / 1000
      local t2 = (event.time + duration - 75) / 1000

      local x = get_lane_x(lane)
      local y1 = love.graphics.getHeight() - (t1 - time) * 600
      local y2 = love.graphics.getHeight() - (t2 - time) * 600

      if y1 < 0 then
        break
      end

      if y2 < love.graphics.getHeight() then
        love.graphics.setColor(colors[lane])
        --love.graphics.circle("fill", x, y, 8)
        love.graphics.line(x, y1, x, y2)
        love.graphics.circle("fill", x, y1, 8)
        love.graphics.circle("fill", x, y2, 8)
        n = n + 1
      elseif not hits[event] then
        hits[event] = true
        -- powers[lane] = powers[lane] + 0.15
      end
    end
  end

  love.graphics.setColor(255, 255, 255)
  love.graphics.print(n, 8, 8)
end
