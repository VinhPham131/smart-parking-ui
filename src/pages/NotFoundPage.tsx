export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-600 mb-8">
          Trang không tồn tại
        </p>
        <p className="text-gray-500 mb-8">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Quay lại trang chủ
        </a>
      </div>
    </div>
  )
}
