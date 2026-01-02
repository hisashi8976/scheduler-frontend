import { Link, useParams } from 'react-router-dom'

function EditPage() {
  const { publicId, editKey } = useParams()

  return (
    <main>
      <h1>編集ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>編集キー: {editKey}</p>
      <p>編集画面の雛形です。</p>
      <nav>
        <ul>
          <li>
            <Link to={`/e/${publicId}`}>回答</Link>
          </li>
          <li>
            <Link to={`/e/${publicId}/results`}>結果</Link>
          </li>
          <li>
            <Link to={`/e/${publicId}/admin`}>主催者</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default EditPage
