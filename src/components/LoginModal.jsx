import { useState } from 'react'
import { postLogin } from '../services/api'

export default function LoginModal({ open, onClose }) {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	if (!open) return null

	const submit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await postLogin({ username, password })
			onClose()
		} catch (err) {
			setError(err.message || '로그인 실패')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
			<div className="bg-gray-900 p-6 rounded-lg w-full max-w-md text-white">
				<h3 className="text-lg font-bold mb-4">로그인</h3>
				{error && <div className="text-red-400 mb-2">{error}</div>}
				<form onSubmit={submit} className="space-y-3">
					<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="아이디" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
					<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" type="password" className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
					<div className="flex justify-end gap-2">
						<button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-700">취소</button>
						<button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600">{loading ? '로딩...' : '로그인'}</button>
					</div>
				</form>
			</div>
		</div>
	)
}
