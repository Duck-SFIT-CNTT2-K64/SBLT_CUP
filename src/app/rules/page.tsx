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
            <Users className="h-5 w-5 text-sblt-red" />
            Quy định cho tuyển thủ
          </h2>
          <ul className="space-y-3 text-sm text-sblt-muted">
            {[
              "Tuyển thủ tham gia bắt buộc phải tắt chế độ che tên (Streamer mode) để Ban Tổ Chức (BTC) tiện theo dõi và xác nhận kết quả.",
              "Tại Chung kết tổng, các tuyển thủ cần phải stream màn hình và cam của mình để tiện cho việc bình luận và Livestream giải.",
              "Tuyển thủ yêu cầu sử dụng đúng Ingame đã đăng ký trong suốt quá trình diễn ra giải đấu. Trường hợp đổi tên Ingame phải liên hệ cho BTC.",
              "Các tuyển thủ phải có mặt và điểm danh trước 15 phút khi trận đấu bắt đầu theo lịch đã chốt.",
              "Tuyển thủ tự chuẩn bị và đảm bảo thiết bị thi đấu (PC/Mobile) cũng như kết nối internet cá nhân.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-sblt-red mt-0.5 shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* BTC Rights */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-sblt-red" />
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
              <div key={i} className="border-l-2 border-sblt-border pl-4">
                <h3 className="font-semibold text-white mb-1 text-sm">{section.title}</h3>
                <p className="text-sblt-muted text-sm leading-relaxed">{section.content}</p>
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
          <ul className="space-y-3 text-sm text-sblt-muted">
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

        {/* Scoring */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-sblt-red" />
            Hệ thống tính điểm
          </h2>
          <div className="bg-sblt-dark rounded-xl overflow-hidden border border-sblt-border">
            <div className="grid grid-cols-2 text-center font-semibold bg-sblt-black border-b-2 border-sblt-red">
              <div className="py-3 border-r border-sblt-border text-sm text-sblt-muted uppercase tracking-wider">Thứ hạng</div>
              <div className="py-3 text-sm text-sblt-muted uppercase tracking-wider">Điểm số</div>
            </div>
            {Object.entries(SCORING).map(([rank, points], i) => (
              <div key={rank} className={`grid grid-cols-2 text-center ${i % 2 === 0 ? "bg-sblt-dark" : "bg-sblt-card"} ${i < 7 ? "border-b border-sblt-border" : ""}`}>
                <div className="py-3 border-r border-sblt-border font-medium text-sblt-white">Top {rank}</div>
                <div className={`py-3 font-bold ${Number(rank) <= 4 ? "text-sblt-red" : "text-sblt-muted"}`}>{points}</div>
              </div>
            ))}
          </div>
          <p className="text-sblt-muted text-sm mt-4">
            Trong trường hợp có tuyển thủ bằng điểm, phân chia thứ hạng dựa trên thứ hạng của game đấu cuối cùng.
          </p>
        </Card>

        {/* Check-in */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-sblt-red" />
            Điểm danh
          </h2>
          <ul className="space-y-3 text-sm text-sblt-muted">
            {[
              "Tuyển thủ phải điểm danh trước 15 phút khi trận đấu bắt đầu.",
              "Nếu không điểm danh đúng giờ, tuyển thủ có thể bị xử thua hoặc tước quyền thi đấu.",
              "Vui lòng theo dõi kênh Discord và thông báo của BTC để biết lịch trình chính xác.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-sblt-red mt-0.5 shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
