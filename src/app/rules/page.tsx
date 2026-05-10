import { AlertTriangle, Shield, Ban, Clock, Monitor, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SCORING } from "@/lib/constants";

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeading title="Quy định chung" subtitle="Quy định và điều lệ giải đấu SBLT CUP" />

      <div className="space-y-6">
        {/* Player Rules */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#dc2626]" />
            Quy định cho tuyển thủ
          </h2>
          <ul className="space-y-3 text-sm text-[#888]">
            {[
              "Tuyển thủ tham gia bắt buộc phải tắt chế độ che tên (Streamer mode) để Ban Tổ Chức (BTC) tiện theo dõi và xác nhận kết quả.",
              "Tại Chung kết tổng, các tuyển thủ cần phải stream màn hình và cam của mình để tiện cho việc bình luận và Livestream giải.",
              "Tuyển thủ yêu cầu sử dụng đúng Ingame đã đăng ký trong suốt quá trình diễn ra giải đấu. Trường hợp đổi tên Ingame phải liên hệ cho BTC.",
              "Các tuyển thủ phải có mặt và điểm danh trước 15 phút khi trận đấu bắt đầu theo lịch đã chốt.",
              "Tuyển thủ tự chuẩn bị và đảm bảo thiết bị thi đấu (PC/Mobile) cũng như kết nối internet cá nhân.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#dc2626] mt-0.5 shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* BTC Rights */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#dc2626]" />
            Quyền hạn của BTC
          </h2>
          <div className="space-y-4">
            {[
              { title: "2.1 Quyền thay đổi lịch trình và thể thức", content: "BTC có toàn quyền thay đổi thời gian thi đấu, dời lịch hoặc điều chỉnh thể thức (ví dụ: từ BO3 sang BO1 nếu gặp sự cố thời gian) để đảm bảo giải đấu diễn ra suôn sẻ. Mọi thay đổi sẽ được thông báo sớm nhất đến tuyển thủ qua các kênh truyền thông chính thức của 5van Official." },
              { title: "2.2 Quyền xử phạt và truất quyền thi đấu", content: "BTC có quyền đưa ra các hình thức kỷ luật đối với tuyển thủ vi phạm quy định, bao gồm nhưng không giới hạn ở: Cảnh cáo (nhắc nhở), trừ điểm ván đấu hoặc điểm tổng, xử thua trắng trận đấu hiện tại, tước quyền thi đấu và hủy bỏ toàn bộ kết quả/giải thưởng nếu phát hiện gian lận hoặc hành vi thiếu văn hóa nghiêm trọng." },
              { title: "2.3 Quyền xử lý sự cố kỹ thuật và trận đấu", content: "BTC có quyền quyết định cho thi đấu lại (Remake) hoặc giữ nguyên kết quả trận đấu trong trường hợp xảy ra lỗi game (Bug), lỗi kết nối mạng diện rộng hoặc các sự cố bất khả kháng khác. Quyết định của BTC sẽ dựa trên mức độ ảnh hưởng của sự cố đến tính công bằng của trận đấu." },
              { title: "2.4 Quyền sử dụng hình ảnh và nội dung", content: "BTC có quyền sử dụng tên tuổi, hình ảnh Ingame, video thi đấu và âm thanh của tuyển thủ tham gia giải đấu cho các mục đích: Livestream trực tiếp, làm nội dung highlight, truyền thông trên mạng xã hội, lưu trữ và quảng bá cho các mùa giải tiếp theo." },
              { title: "2.5 Quyền từ chối đăng ký", content: "BTC có quyền từ chối sự tham gia của bất kỳ cá nhân nào nếu phát hiện thông tin đăng ký không trung thực, tuyển thủ đang trong thời gian bị cấm thi đấu từ các giải chính thức của VNG/Riot, hoặc có lịch sử gây ảnh hưởng tiêu cực đến cộng đồng." },
              { title: "2.6 Quyền quyết định cuối cùng", content: "Trong mọi trường hợp xảy ra khiếu nại hoặc tranh chấp, sau khi xem xét các bằng chứng và tham khảo ý kiến đội ngũ trọng tài, quyết định của BTC là quyết định cuối cùng và có hiệu lực thi hành ngay lập tức. Các bên liên quan không có quyền khiếu nại thêm sau khi quyết định cuối cùng đã được đưa ra." },
            ].map((section, i) => (
              <div key={i} className="border-l-2 border-[#222] pl-4">
                <h3 className="font-semibold text-[#f5f5f5] mb-1 text-sm">{section.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Prohibited Actions */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Các hành vi bị cấm
          </h2>
          <ul className="space-y-3 text-sm text-[#888]">
            {[
              "Tuyệt đối không được đầu hàng (Surrender) trong lúc thi đấu dưới bất kỳ hình thức nào.",
              "Nghiêm cấm lợi dụng lỗi game (bugs), thông đồng, sắp đặt kết quả (teaming).",
              "Không sử dụng thiết bị hoặc phần mềm bên thứ ba để can thiệp vào trận đấu.",
              "Nghiêm cấm sử dụng người thi đấu hộ hoặc dùng tài khoản không đúng danh sách đăng ký.",
              "Nghiêm cấm ngôn từ kích động, quấy rối hoặc lăng mạ đối thủ.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Tournament Format */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#dc2626]" />
            Thể thức giải đấu
          </h2>
          <div className="space-y-4">
            {[
              {
                title: "Vòng Loại (19/05)",
                details: [
                  "Quy mô: 64 tuyển thủ",
                  "Phân bằng: Chia làm 8 bảng (8 người/bảng)",
                  "Số trận: Đánh 3 game mỗi bảng",
                  "Điều kiện đi tiếp: 2 tuyển thủ có tổng điểm cao nhất mỗi bảng sẽ tiến vào Vòng 2 (Tổng 16 người)",
                ]
              },
              {
                title: "Vòng 2 (20/05)",
                details: [
                  "Thành phần: 16 tuyển thủ từ Vòng Loại + 16 tuyển thủ Khách mời",
                  "Phân bằng: Tổng 32 người chia thành 4 bảng (4 tuyển thủ Vòng Loại + 4 Khách mời/bảng)",
                  "Số trận: Đánh 3 game mỗi bảng",
                  "Điều kiện đi tiếp: 4 tuyển thủ cao điểm nhất mỗi bảng sẽ tiến vào Vòng 3 (Tổng 16 người)",
                ]
              },
              {
                title: "Vòng 3 (21/05)",
                details: [
                  "Thành phần: 16 tuyển thủ vượt qua Vòng 2",
                  "Phân bằng: Chia làm 2 bảng theo quy tắc seeding - Lobby 1 ghép Lobby 3, Lobby 2 ghép Lobby 4 (4 người/lobby/bảng)",
                  "Số trận: Đánh 3 game mỗi bảng",
                  "Điều kiện đi tiếp: 4 tuyển thủ cao điểm nhất mỗi bảng sẽ tiến vào Chung kết Tổng (Tổng 8 người)",
                ]
              },
              {
                title: "Vòng Chung Kết Tổng (22/05)",
                details: [
                  "Thành phần: 8 tuyển thủ xuất sắc nhất",
                  "Số trận: Đánh 3 game",
                  "Xác định thứ hạng dựa trên tổng điểm tích lũy sau 3 trận",
                ]
              },
            ].map((stage, i) => (
              <div key={i} className="border-l-2 border-[#222] pl-4">
                <h3 className="font-semibold text-[#f5f5f5] mb-2 text-sm">{stage.title}</h3>
                <ul className="space-y-1">
                  {stage.details.map((detail, j) => (
                    <li key={j} className="text-[#888] text-sm flex items-start gap-2">
                      <span className="text-[#dc2626] mt-0.5 shrink-0">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Tie-break Rules */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#dc2626]" />
            Quy tắc xét tie-break
          </h2>
          <p className="text-[#888] text-sm mb-4">
            Khi hai hoặc nhiều tuyển thủ có cùng tổng điểm tích lũy, thứ tự ưu tiên để phân định hạng sẽ là:
          </p>
          <div className="space-y-3">
            {[
              { step: "1", title: "Số lần đạt Top 1", desc: "Người có nhiều vận đạt thứ hạng #1 hơn" },
              { step: "2", title: "Số lần Top 4", desc: "Người có nhiều vận nằm trong Top #4 hơn" },
              { step: "3", title: "Số lần Top 8", desc: "Người có ít vận nằm ở #8 hơn" },
              { step: "4", title: "Thứ hạng game cuối", desc: "Người có thứ hạng cao hơn (tốt hơn) trong game đấu gần nhất" },
            ].map((rule, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#dc2626]">
                    <span className="text-white text-sm font-bold">{rule.step}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#f5f5f5] text-sm">{rule.title}</h4>
                  <p className="text-[#888] text-sm">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Scoring */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-[#dc2626]" />
            Hệ thống tính điểm
          </h2>
          <div className="bg-[#0e0e0e] rounded-xl overflow-hidden border border-[#222]">
            <div className="grid grid-cols-2 text-center font-semibold bg-[#0a0a0a] border-b-2 border-[#dc2626]">
              <div className="py-3 border-r border-[#222] text-sm text-[#888] uppercase tracking-wider">Thứ hạng</div>
              <div className="py-3 text-sm text-[#888] uppercase tracking-wider">Điểm số</div>
            </div>
            {Object.entries(SCORING).map(([rank, points], i) => (
              <div key={rank} className={`grid grid-cols-2 text-center ${i % 2 === 0 ? "bg-[#0e0e0e]" : "bg-[#111]"} ${i < 7 ? "border-b border-[#222]" : ""}`}>
                <div className="py-3 border-r border-[#222] font-medium text-[#f5f5f5]">Top {rank}</div>
                <div className={`py-3 font-bold ${Number(rank) <= 4 ? "text-[#dc2626]" : "text-[#888]"}`}>{points}</div>
              </div>
            ))}
          </div>
          <p className="text-[#888] text-sm mt-4">
            Trong trường hợp có tuyển thủ bằng điểm, phân chia thứ hạng dựa trên thứ hạng của game đấu cuối cùng.
          </p>
        </Card>

        {/* Check-in */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#dc2626]" />
            Điểm danh
          </h2>
          <ul className="space-y-3 text-sm text-[#888]">
            {[
              "Tuyển thủ phải điểm danh trước 15 phút khi trận đấu bắt đầu.",
              "Nếu không điểm danh đúng giờ, tuyển thủ có thể bị xử thua hoặc tước quyền thi đấu.",
              "Vui lòng theo dõi kênh Discord và thông báo của BTC để biết lịch trình chính xác.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#dc2626] mt-0.5 shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
