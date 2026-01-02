import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const [publicId, setPublicId] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = publicId.trim()
    if (!trimmed) {
      return
    }
    navigate(`/e/${encodeURIComponent(trimmed)}`)
  }

  return (
    <main>
      <h1>ホーム</h1>
      <p>公開IDを入力して回答ページへ移動します。</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="publicId">公開ID</label>
        <div>
          <input
            id="publicId"
            name="publicId"
            value={publicId}
            onChange={(event) => setPublicId(event.target.value)}
            placeholder="public-id"
            autoComplete="off"
          />
          <button type="submit">移動</button>
        </div>
      </form>
    </main>
  )
}

export default HomePage
