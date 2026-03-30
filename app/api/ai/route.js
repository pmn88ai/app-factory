export async function POST(request) {
  try {
    const { mode, content } = await request.json()

    if (!content?.trim()) {
      return Response.json({ error: 'Nội dung trống' }, { status: 400 })
    }

    const prompts = {
      summarize:  `Tóm tắt nội dung sau thành spec ngắn gọn, rõ ràng. Trả lời bằng tiếng Việt:\n\n${content}`,
      improve:    `Cải thiện nội dung sau để production-ready, giữ nguyên ý định gốc. Trả lời bằng tiếng Việt:\n\n${content}`,
      review:     `Tìm lỗi logic, thiếu sót, hoặc rủi ro trong nội dung sau. Trả lời bằng tiếng Việt:\n\n${content}`,
      finalCheck: `Đây là code/spec cuối cùng của một app. Review toàn diện:\n- Kiến trúc có hợp lý không?\n- Có thiếu sót gì quan trọng không?\n- Có lỗi logic nào không?\n- Cần cải thiện gì trước khi deploy?\nTrả lời bằng tiếng Việt, chi tiết:\n\n${content}`,
    }

    const systemPrompts = {
      summarize:  'Mày là technical writer chuyên viết spec ngắn gọn, chính xác cho developers.',
      improve:    'Mày là senior developer 10 năm kinh nghiệm, chuyên cải thiện spec/code.',
      review:     'Mày là QA engineer và security expert, chuyên tìm lỗi và rủi ro.',
      finalCheck: 'Mày là senior fullstack developer, chuyên review code trước khi deploy.',
    }

    const prompt = prompts[mode]
    const systemPrompt = systemPrompts[mode]

    if (!prompt) {
      return Response.json({ error: 'Mode không hợp lệ' }, { status: 400 })
    }

    // Groq API — OpenAI-compatible format
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Groq API error:', err)
      return Response.json({ error: 'AI gặp lỗi, thử lại nhé' }, { status: 500 })
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content || ''

    return Response.json({ result })
  } catch (error) {
    console.error('Route error:', error)
    return Response.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
