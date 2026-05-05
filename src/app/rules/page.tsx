import { AlertTriangle, Shield, Ban, Clock, Monitor, Users } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Quy định chung</h1>
        <p className="text-gray-400">Quy định và điều lệ giải đấu SBLT CUP</p>
      </div>

      <div className="space-y-8">
        {/* Player Rules */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-yellow-500" />
            Quy định cho tuyển thủ
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <span>
                Tuyển thủ tham gia bắt buộc phải tắt chế độ che tên (Streamer mode) để Ban Tổ
                Chức (BTC) tiện theo dõi và xác nhận kết quả.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <span>
                Tại Chung kết tổng, các tuyển thủ cần phải stream màn hình và cam của mình để
                tiện cho việc bình luận và Livestream giải.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <span>
                Tuyển thủ yêu cầu sử dụng đúng Ingame đã đăng ký trong suốt quá trình diễn ra
                giải đấu. Trường hợp đổi tên Ingame phải liên hệ cho BTC.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <span>
                Các tuyển thủ phải có mặt và điểm danh trước 15 phút khi trận đấu bắt đầu theo
                lịch đã chốt.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <span>
                Tuyển thủ tự chuẩn bị và đảm bảo thiết bị thi đấu (PC/Mobile) cũng như kết nối
                internet cá nhân.
              </span>
            </li>
          </ul>
        </div>

        {/* BTC Rights */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Quyền hạn của BTC
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">2.1 Quyền thay đổi lịch trình và thể thức</h3>
              <p className="text-gray-300 text-sm">
                BTC có toàn quyền thay đổi thời gian thi đấu, dời lịch hoặc điều chỉnh thể thức
                (ví dụ: từ BO3 sang BO1 nếu gặp sự cố thời gian) để đảm bảo giải đấu diễn ra suôn
                sẻ. Mọi thay đổi sẽ được thông báo sớm nhất đến tuyển thủ qua các kênh truyền thông
                chính thức của 5van Official.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2.2 Quyền xử phạt và truất quyền thi đấu</h3>
              <p className="text-gray-300 text-sm">
                BTC có quyền đưa ra các hình thức kỷ luật đối với tuyển thủ vi phạm quy định, bao
                gồm nhưng không giới hạn ở: Cảnh cáo (nhắc nhở), trừ điểm ván đấu hoặc điểm tổng,
                xử thua trắng trận đấu hiện tại, tước quyền thi đấu và hủy bỏ toàn bộ kết
                quả/giải thưởng nếu phát hiện gian lận hoặc hành vi thiếu văn hóa nghiêm trọng.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2.3 Quyền xử lý sự cố kỹ thuật và trận đấu</h3>
              <p className="text-gray-300 text-sm">
                BTC có quyền quyết định cho thi đấu lại (Remake) hoặc giữ nguyên kết quả trận đấu
                trong trường hợp xảy ra lỗi game (Bug), lỗi kết nối mạng diện rộng hoặc các sự cố
                bất khả kháng khác. Quyết định của BTC sẽ dựa trên mức độ ảnh hưởng của sự cố đến
                tính công bằng của trận đấu.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2.4 Quyền sử dụng hình ảnh và nội dung</h3>
              <p className="text-gray-300 text-sm">
                BTC có quyền sử dụng tên tuổi, hình ảnh Ingame, video thi đấu và âm thanh của
                tuyển thủ tham gia giải đấu cho các mục đích: Livestream trực tiếp, làm nội dung
                highlight, truyền thông trên mạng xã hội, lưu trữ và quảng bá cho các mùa giải
                tiếp theo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2.5 Quyền từ chối đăng ký</h3>
              <p className="text-gray-300 text-sm">
                BTC có quyền từ chối sự tham gia của bất kỳ cá nhân nào nếu phát hiện thông tin
                đăng ký không trung thực, tuyển thủ đang trong thời gian bị cấm thi đấu từ các
                giải chính thức của VNG/Riot, hoặc có lịch sử gây ảnh hưởng tiêu cực đến cộng đồng.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2.6 Quyền quyết định cuối cùng</h3>
              <p className="text-gray-300 text-sm">
                Trong mọi trường hợp xảy ra khiếu nại hoặc tranh chấp, sau khi xem xét các bằng
                chứng và tham khảo ý kiến đội ngũ trọng tài, quyết định của BTC là quyết định cuối
                cùng và có hiệu lực thi hành ngay lập tức. Các bên liên quan không có quyền khiếu
                nại thêm sau khi quyết định cuối cùng đã được đưa ra.
              </p>
            </div>
          </div>
        </div>

        {/* Prohibited Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Các hành vi bị cấm
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Tuyệt đối không được đầu hàng (Surrender) trong lúc thi đấu dưới bất kỳ hình thức
                nào.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Nghiêm cấm lợi dụng lỗi game (bugs), thông đồng, sắp đặt kết quả (teaming).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Không sử dụng thiết bị hoặc phần mềm bên thứ ba để can thiệp vào trận đấu.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Nghiêm cấm sử dụng người thi đấu hộ hoặc dùng tài khoản không đúng danh sách đăng
                ký.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Nghiêm cấm ngôn từ kích động, quấy rối hoặc lăng mạ đối thủ.
              </span>
            </li>
          </ul>
        </div>

        {/* Scoring */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-green-500" />
            Hệ thống tính điểm
          </h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 text-center font-semibold bg-gray-700">
              <div className="py-3 border-r border-gray-600">Thứ hạng</div>
              <div className="py-3">Điểm số</div>
            </div>
            {[
              { rank: "Top 1", points: 8 },
              { rank: "Top 2", points: 7 },
              { rank: "Top 3", points: 6 },
              { rank: "Top 4", points: 5 },
              { rank: "Top 5", points: 4 },
              { rank: "Top 6", points: 3 },
              { rank: "Top 7", points: 2 },
              { rank: "Top 8", points: 1 },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 text-center ${
                  i % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                } ${i < 7 ? "border-b border-gray-700" : ""}`}
              >
                <div className="py-3 border-r border-gray-700 font-medium">{row.rank}</div>
                <div className="py-3 font-bold text-yellow-500">{row.points}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Trong trường hợp có tuyển thủ bằng điểm, phân chia thứ hạng dựa trên thứ hạng của
            game đấu cuối cùng.
          </p>
        </div>

        {/* Check-in */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Điểm danh
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>
                Tuyển thủ phải điểm danh trước 15 phút khi trận đấu bắt đầu.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>
                Nếu không điểm danh đúng giờ, tuyển thủ có thể bị xử thua hoặc tước quyền thi
                đấu.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>
                Vui lòng theo dõi kênh Discord và thông báo của BTC để biết lịch trình chính xác.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
