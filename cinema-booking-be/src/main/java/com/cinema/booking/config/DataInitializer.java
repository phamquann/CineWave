package com.cinema.booking.config;

import com.cinema.booking.dto.request.CreateShowtimeRequest;
import com.cinema.booking.model.Movie;
import com.cinema.booking.model.User;
import com.cinema.booking.model.Voucher;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.UserRepository;
import com.cinema.booking.repository.VoucherRepository;
import com.cinema.booking.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;
    private final VoucherRepository voucherRepository;
    private final ShowtimeService showtimeService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedVouchers();
        seedMoviesAndShowtimes();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            return;
        }
        log.info("Seeding default users (Admin, Staff, Customer)...");
        List<User> users = List.of(
                User.builder()
                        .email("admin@cinema.com")
                        .password(passwordEncoder.encode("Admin@123"))
                        .fullName("Quản Trị Viên Hệ Thống")
                        .phone("0901000001")
                        .role("ADMIN")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build(),
                User.builder()
                        .email("staff@cinema.com")
                        .password(passwordEncoder.encode("Staff@123"))
                        .fullName("Nhân Viên Soát Vé")
                        .phone("0901000002")
                        .role("STAFF")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build(),
                User.builder()
                        .email("customer@cinema.com")
                        .password(passwordEncoder.encode("Customer@123"))
                        .fullName("Nguyễn Văn Khách")
                        .phone("0901000003")
                        .role("CUSTOMER")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build(),
                User.builder()
                        .email("testlock@cinema.com")
                        .password(passwordEncoder.encode("Test@1234"))
                        .fullName("Tài Khoản Test Khóa")
                        .phone("0901000004")
                        .role("CUSTOMER")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build()
        );
        userRepository.saveAll(users);
    }

    private void seedVouchers() {
        if (voucherRepository.count() > 0) {
            return;
        }
        log.info("Seeding vouchers for Decision Table & Boundary Testing...");
        LocalDateTime now = LocalDateTime.now();

        List<Voucher> vouchers = List.of(
                Voucher.builder()
                        .code("GIAM50K")
                        .description("Giảm trực tiếp 50.000đ cho đơn hàng từ 150.000đ")
                        .discountType("FIXED")
                        .discountValue(50000)
                        .maxDiscountAmount(50000.0)
                        .minOrderValue(150000)
                        .usageLimit(100)
                        .usedCount(0)
                        .startDate(now.minusDays(10))
                        .expiryDate(now.plusDays(60))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("CINEWAVE20")
                        .description("Giảm 20% (tối đa 60.000đ) cho đơn từ 100.000đ")
                        .discountType("PERCENT")
                        .discountValue(20)
                        .maxDiscountAmount(60000.0)
                        .minOrderValue(100000)
                        .usageLimit(50)
                        .usedCount(0)
                        .startDate(now.minusDays(10))
                        .expiryDate(now.plusDays(60))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("VIP50PT")
                        .description("Giảm 50% (tối đa 80.000đ) cho đơn từ 200.000đ")
                        .discountType("PERCENT")
                        .discountValue(50)
                        .maxDiscountAmount(80000.0)
                        .minOrderValue(200000)
                        .usageLimit(30)
                        .usedCount(0)
                        .startDate(now.minusDays(5))
                        .expiryDate(now.plusDays(30))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("EXPIRED10")
                        .description("Mã giảm giá đã hết hạn sử dụng (Test Case)")
                        .discountType("FIXED")
                        .discountValue(30000)
                        .maxDiscountAmount(30000.0)
                        .minOrderValue(80000)
                        .usageLimit(50)
                        .usedCount(0)
                        .startDate(now.minusDays(30))
                        .expiryDate(now.minusDays(1))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("FUTURE50")
                        .description("Mã giảm giá chưa tới ngày mở (Test Case)")
                        .discountType("FIXED")
                        .discountValue(50000)
                        .maxDiscountAmount(50000.0)
                        .minOrderValue(100000)
                        .usageLimit(50)
                        .usedCount(0)
                        .startDate(now.plusDays(5))
                        .expiryDate(now.plusDays(30))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("SOLDOUT99")
                        .description("Mã giảm giá đã hết lượt sử dụng (Test Case)")
                        .discountType("FIXED")
                        .discountValue(40000)
                        .maxDiscountAmount(40000.0)
                        .minOrderValue(80000)
                        .usageLimit(10)
                        .usedCount(10)
                        .startDate(now.minusDays(10))
                        .expiryDate(now.plusDays(20))
                        .isActive(true)
                        .build()
        );
        voucherRepository.saveAll(vouchers);
    }

    private void seedMoviesAndShowtimes() {
        List<Movie> existing = movieRepository.findAll();
        boolean needsUpgrade = existing.size() < 16 || existing.stream().anyMatch(m -> m.getPosterUrl() == null || m.getPosterUrl().isBlank());
        if (!needsUpgrade) {
            return;
        }

        log.info("Upgrading & Seeding 16 Blockbuster Movies with Poster, Backdrop, Trailer & Showtimes...");
        showtimeRepository.deleteAll();
        movieRepository.deleteAll();

        // 1. Dune: Part Two
        Movie m1 = movieRepository.save(Movie.builder()
                .title("Dune: Hành Tinh Cát - Phần Hai")
                .tagline("Vạn tuế những chiến binh sa mạc Arrakis.")
                .synopsis("Paul Atreides hợp nhất cùng Chani và tộc người Fremen trên hành tinh cát Arrakis để mở cuộc chiến báo thù những kẻ đã hủy diệt gia tộc anh. Đứng trước lựa chọn giữa tình yêu của cuộc đời và số phận của toàn vũ trụ, anh phải ngăn chặn một tương lai tàn khốc mà chỉ mình anh nhìn thấy.")
                .director("Denis Villeneuve")
                .cast(List.of("Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem", "Austin Butler"))
                .genres(List.of("Sci-Fi", "Adventure", "Action"))
                .formats(List.of("IMAX", "4DX", "Dolby Atmos", "VIP"))
                .durationMinutes(166)
                .ageRating("T13")
                .status("NOW_SHOWING")
                .rating(9.5)
                .votesCount("142.8k")
                .themeColor("#D97706")
                .accentColor("#FBBF24")
                .featured(true)
                .posterUrl("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/Way9Dexny3w")
                .build());

        // 2. Deadpool & Wolverine
        Movie m2 = movieRepository.save(Movie.builder()
                .title("Deadpool & Wolverine")
                .tagline("Hai gã phản anh hùng bất đắc dĩ giải cứu toàn bộ Đa Vũ Trụ Marvel.")
                .synopsis("Wade Wilson đang tận hưởng cuộc sống bình yên thì bị Cơ quan Phương sai Thời gian (TVA) kéo vào nhiệm vụ giải cứu Đa vũ trụ. Để ngăn chặn thế giới quê hương bị xóa sổ, Deadpool buộc phải thuyết phục một Wolverine bất cần đời cùng hợp tác trong chuyến phiêu lưu đẫm máu và lầy lội nhất lịch sử.")
                .director("Shawn Levy")
                .cast(List.of("Ryan Reynolds", "Hugh Jackman", "Emma Corrin", "Matthew Macfadyen"))
                .genres(List.of("Action", "Comedy", "Sci-Fi"))
                .formats(List.of("IMAX", "4DX", "Dolby Atmos", "VIP"))
                .durationMinutes(128)
                .ageRating("T18")
                .status("NOW_SHOWING")
                .rating(9.2)
                .votesCount("118.4k")
                .themeColor("#DC2626")
                .accentColor("#FACC15")
                .featured(true)
                .posterUrl("https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/73_1biulkYk")
                .build());

        // 3. Oppenheimer
        Movie m3 = movieRepository.save(Movie.builder()
                .title("Oppenheimer")
                .tagline("Khoảnh khắc thế giới thay đổi mãi mãi.")
                .synopsis("Câu chuyện lịch sử chấn động về nhà vật lý lý thuyết J. Robert Oppenheimer – giám đốc Phòng thí nghiệm Los Alamos trong Dự án Manhattan – người đã dẫn dắt việc chế tạo quả bom nguyên tử đầu tiên trong Thế chiến II và phải đối mặt với tòa án lương tâm suốt phần đời còn lại.")
                .director("Christopher Nolan")
                .cast(List.of("Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"))
                .genres(List.of("Drama", "History", "Thriller"))
                .formats(List.of("IMAX", "Dolby Atmos", "VIP"))
                .durationMinutes(180)
                .ageRating("T18")
                .status("NOW_SHOWING")
                .rating(9.4)
                .votesCount("135.2k")
                .themeColor("#EA580C")
                .accentColor("#FB923C")
                .featured(true)
                .posterUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/uYPbbksJxIg")
                .build());

        // 4. Mai
        Movie m4 = movieRepository.save(Movie.builder()
                .title("Mai")
                .tagline("Quá khứ ngủ yên, liệu ngày mai có bình yên?")
                .synopsis("Mai – một người phụ nữ gần 40 tuổi làm nghề massage mang nhiều vết sẹo quá khứ – tình cờ gặp Dương, chàng nhạc công đào hoa kém cô 7 tuổi sống cùng khu chung cư. Khi tình yêu chớm nở cũng là lúc những định kiến gia đình và bi kịch cũ trỗi dậy thử thách hạnh phúc của cả hai.")
                .director("Trấn Thành")
                .cast(List.of("Phương Anh Đào", "Tuấn Trần", "Hồng Đào", "Trấn Thành", "Uyển Ân"))
                .genres(List.of("Romance", "Drama", "Family"))
                .formats(List.of("Dolby Atmos", "VIP"))
                .durationMinutes(131)
                .ageRating("T18")
                .status("NOW_SHOWING")
                .rating(9.1)
                .votesCount("96.5k")
                .themeColor("#E11D48")
                .accentColor("#FDA4AF")
                .featured(true)
                .posterUrl("https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/EX6clvId19s")
                .build());

        // 5. Lật Mặt 7: Một Điều Ước
        Movie m5 = movieRepository.save(Movie.builder()
                .title("Lật Mặt 7: Một Điều Ước")
                .tagline("Mẹ một mình nuôi được 5 người con, nhưng 5 người con có nuôi nổi một người mẹ?")
                .synopsis("Bà Hai (73 tuổi) sống một mình nơi vùng cao nguyên Lạc Dương bất ngờ gặp tai nạn bó bột chân. 5 người con sống ở 5 miền đất nước với những gánh nặng cơm áo gạo tiền riêng phải thay phiên nhau chăm mẹ mỗi người một tuần, mở ra hành trình chữa lành đầy nước mắt về tình mẫu tử.")
                .director("Lý Hải")
                .cast(List.of("Thanh Hiền", "Trương Minh Cường", "Đinh Y Nhung", "Quách Ngọc Tuyên", "Trâm Anh"))
                .genres(List.of("Family", "Drama", "Comedy"))
                .formats(List.of("Dolby Atmos", "VIP"))
                .durationMinutes(138)
                .ageRating("P")
                .status("NOW_SHOWING")
                .rating(9.3)
                .votesCount("88.9k")
                .themeColor("#059669")
                .accentColor("#6EE7B7")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/Q2B7w8t2x9c")
                .build());

        // 6. Exhuma: Quật Mộ Trùng Ma
        Movie m6 = movieRepository.save(Movie.builder()
                .title("Exhuma: Quật Mộ Trùng Ma")
                .tagline("Có những ngôi mộ cổ tuyệt đối không bao giờ được phép khai quật.")
                .synopsis("Hai pháp sư trẻ nổi tiếng Hwa-rim và Bong-gil cùng bậc thầy phong thủy Sang-deok được một gia tộc tài phiệt thuê khai quật ngôi mộ tổ tiên đặt tại vùng núi hẻo lánh Hàn Quốc. Khi nắp quan tài bật mở, một thế lực tà ác trăm năm ẩn dưới lòng đất chính thức thoát ra.")
                .director("Jang Jae-hyun")
                .cast(List.of("Choi Min-sik", "Kim Go-eun", "Yoo Hae-jin", "Lee Do-hyun"))
                .genres(List.of("Horror", "Mystery", "Thriller"))
                .formats(List.of("4DX", "Dolby Atmos", "VIP"))
                .durationMinutes(134)
                .ageRating("T16")
                .status("NOW_SHOWING")
                .rating(9.0)
                .votesCount("74.3k")
                .themeColor("#475569")
                .accentColor("#94A3B8")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/ceb2E811b6U")
                .build());

        // 7. Inside Out 2: Những Mảnh Ghép Cảm Xúc 2
        Movie m7 = movieRepository.save(Movie.builder()
                .title("Inside Out 2: Những Mảnh Ghép Cảm Xúc 2")
                .tagline("Tuổi dậy thì ập đến cùng những vị khách cảm xúc hoàn toàn mới!")
                .synopsis("Khi cô bé Riley chính thức bước sang tuổi 13, Trung tâm Đầu não bất ngờ bị đập phá để nhường chỗ cho 4 cảm xúc tuổi dậy thì hoàn toàn mới: Lo Âu (Anxiety), Ganh Tị (Envy), Chán Nản (Ennui) và Xấu Hổ (Embarrassment). Vui Vẻ và nhóm cảm xúc cũ phải tìm cách giành lại sự cân bằng cho Riley.")
                .director("Kelsey Mann")
                .cast(List.of("Amy Poehler", "Maya Hawke", "Kensington Tallman", "Phyllis Smith"))
                .genres(List.of("Animation", "Family", "Comedy"))
                .formats(List.of("3D", "Dolby Atmos", "VIP"))
                .durationMinutes(100)
                .ageRating("P")
                .status("NOW_SHOWING")
                .rating(9.2)
                .votesCount("91.0k")
                .themeColor("#7C3AED")
                .accentColor("#C4B5FD")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/LEjhY15eCx0")
                .build());

        // 8. Avatar: Dòng Chảy Của Nước
        Movie m8 = movieRepository.save(Movie.builder()
                .title("Avatar: Dòng Chảy Của Nước")
                .tagline("Trở lại Pandora trong kỷ nguyên đại dương kỳ vĩ.")
                .synopsis("Hơn một thập kỷ sau cuộc chiến đầu tiên trên Pandora, Jake Sully và Neytiri đã xây dựng một gia đình hạnh phúc. Tuy nhiên, khi mối đe dọa từ người Trái Đất quay trở lại, gia đình Sully buộc phải rời bỏ khu rừng quê hương để tìm nơi ẩn náu tại bộ tộc biển Metkayina.")
                .director("James Cameron")
                .cast(List.of("Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Kate Winslet"))
                .genres(List.of("Sci-Fi", "Adventure", "Fantasy"))
                .formats(List.of("IMAX", "3D", "4DX", "Dolby Atmos"))
                .durationMinutes(192)
                .ageRating("T13")
                .status("NOW_SHOWING")
                .rating(9.4)
                .votesCount("156.0k")
                .themeColor("#0284C7")
                .accentColor("#38BDF8")
                .featured(true)
                .posterUrl("https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/d9MyW72ELq0")
                .build());

        // 9. Spider-Man: Du Hành Vũ Trụ Nhện
        Movie m9 = movieRepository.save(Movie.builder()
                .title("Spider-Man: Du Hành Vũ Trụ Nhện")
                .tagline("Một người nhện có thể thay đổi số phận của cả Đa Vũ Trụ.")
                .synopsis("Miles Morales tái ngộ Gwen Stacy và được đưa xuyên qua Đa Vũ Trụ đến trụ sở của Hội Nhện (Spider-Society) do Miguel O'Hara đứng đầu. Khi các Người Nhện bất đồng về cách bảo vệ thực tại, Miles phải một mình đối đầu toàn bộ Hội Nhện để cứu lấy người thân yêu nhất.")
                .director("Joaquim Dos Santos")
                .cast(List.of("Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Daniel Kaluuya"))
                .genres(List.of("Animation", "Action", "Sci-Fi"))
                .formats(List.of("IMAX", "4DX", "Dolby Atmos"))
                .durationMinutes(140)
                .ageRating("P")
                .status("NOW_SHOWING")
                .rating(9.5)
                .votesCount("112.4k")
                .themeColor("#E11D48")
                .accentColor("#38BDF8")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/cqGjhVJWtEg")
                .build());

        // 10. Godzilla x Kong: Đế Chế Mới
        Movie m10 = movieRepository.save(Movie.builder()
                .title("Godzilla x Kong: Đế Chế Mới")
                .tagline("Cùng trỗi dậy hoặc cùng diệt vong.")
                .synopsis("Hai siêu quái thú hùng mạnh nhất hành tinh – Kong và Godzilla – buộc phải gạt bỏ hiềm khích để liên minh chống lại một mối đe dọa khổng lồ ẩn sâu trong Trái Đất Rỗng: bạo chúa Skar King và quái thú băng giá cổ đại Shimo.")
                .director("Adam Wingard")
                .cast(List.of("Rebecca Hall", "Brian Tyree Henry", "Dan Stevens", "Kaylee Hottle"))
                .genres(List.of("Action", "Sci-Fi", "Adventure"))
                .formats(List.of("IMAX", "4DX", "3D"))
                .durationMinutes(115)
                .ageRating("T13")
                .status("NOW_SHOWING")
                .rating(8.8)
                .votesCount("67.2k")
                .themeColor("#9333EA")
                .accentColor("#F472B6")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/lV1OOlGwExM")
                .build());

        // 11. Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô
        Movie m11 = movieRepository.save(Movie.builder()
                .title("Conan: Ngôi Sao 5 Cánh 1 Triệu Đô")
                .tagline("Bí mật ẩn giấu sau thanh kiếm cổ tại Hakodate.")
                .synopsis("Siêu đạo chích Kaito Kid gửi tối hậu thư tuyên bố sẽ đánh cắp hai thanh kiếm cổ thời Bakumatsu thuộc sở hữu của tập đoàn tài phiệt Onoe tại Hakodate. Conan và Heiji Hattori bước vào cuộc đấu trí nghẹt thở để giải mã kho báu triệu đô và thân phận thật của Kid.")
                .director("Chika Nagaoka")
                .cast(List.of("Minami Takayama", "Kappei Yamaguchi", "Ryo Horikawa", "Wakana Yamazaki"))
                .genres(List.of("Animation", "Mystery", "Action"))
                .formats(List.of("Dolby Atmos", "VIP"))
                .durationMinutes(111)
                .ageRating("T13")
                .status("NOW_SHOWING")
                .rating(9.2)
                .votesCount("83.1k")
                .themeColor("#2563EB")
                .accentColor("#60A5FA")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/C4pM3v2tG20")
                .build());

        // 12. Interstellar: Hố Đen Tử Thần
        Movie m12 = movieRepository.save(Movie.builder()
                .title("Interstellar: Hố Đen Tử Thần (IMAX)")
                .tagline("Tình yêu là thứ duy nhất vượt qua chiều không gian và thời gian.")
                .synopsis("Khi Trái Đất dần cạn kiệt sự sống, cựu phi công NASA Cooper cùng đoàn nhà khoa học thực hiện chuyến du hành xuyên qua hố sâu (Wormhole) gần Sao Thổ để tìm kiếm hành tinh mới cho nhân loại, đánh đổi bằng những năm tháng xa cách cô con gái Murph.")
                .director("Christopher Nolan")
                .cast(List.of("Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"))
                .genres(List.of("Sci-Fi", "Drama", "Adventure"))
                .formats(List.of("IMAX", "Dolby Atmos", "VIP"))
                .durationMinutes(169)
                .ageRating("T13")
                .status("NOW_SHOWING")
                .rating(9.7)
                .votesCount("210.5k")
                .themeColor("#4F46E5")
                .accentColor("#818CF8")
                .featured(true)
                .posterUrl("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/zSWdZVtXT7E")
                .build());

        // 13. Joker: Folie à Deux (COMING_SOON)
        Movie m13 = movieRepository.save(Movie.builder()
                .title("Joker: Điên Có Đôi (Folie à Deux)")
                .tagline("Thế giới là một sân khấu, và ông hoàng không còn cô độc.")
                .synopsis("Bị giam giữ tại bệnh viện tâm thần Arkham chờ ngày xét xử cho những tội ác trong lốt Joker, Arthur Fleck tình cờ gặp gỡ Harley Quinn. Cả hai bước vào một bản giao hưởng điên loạn giữa thực tại và ảo mộng âm nhạc tại thành phố Gotham.")
                .director("Todd Phillips")
                .cast(List.of("Joaquin Phoenix", "Lady Gaga", "Brendan Gleeson", "Catherine Keener"))
                .genres(List.of("Crime", "Drama", "Thriller"))
                .formats(List.of("IMAX", "Dolby Atmos", "VIP"))
                .durationMinutes(138)
                .ageRating("T18")
                .status("COMING_SOON")
                .rating(8.9)
                .votesCount("45.0k")
                .themeColor("#991B1B")
                .accentColor("#F87171")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/_OKAwz2MsJs")
                .build());

        // 14. Venom: The Last Dance (COMING_SOON)
        Movie m14 = movieRepository.save(Movie.builder()
                .title("Venom: Kèo Cuối (The Last Dance)")
                .tagline("Cho đến khi cái chết chia lìa đôi ta.")
                .synopsis("Eddie Brock và cộng sinh trùng Venom rơi vào cuộc đào tẩu sinh tử khi bị truy sát bởi cả lực lượng quân đội Trái Đất lẫn binh đoàn quái vật Symbiote do chúa tể hắc ám Knull phái xuống từ ngoài không gian.")
                .director("Kelly Marcel")
                .cast(List.of("Tom Hardy", "Chiwetel Ejiofor", "Juno Temple", "Rhys Ifans"))
                .genres(List.of("Action", "Sci-Fi", "Thriller"))
                .formats(List.of("IMAX", "4DX", "3D"))
                .durationMinutes(110)
                .ageRating("T13")
                .status("COMING_SOON")
                .rating(8.7)
                .votesCount("39.2k")
                .themeColor("#1E293B")
                .accentColor("#38BDF8")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/__2bjWbetsA")
                .build());

        // 15. Wicked: Phần 1 (COMING_SOON)
        Movie m15 = movieRepository.save(Movie.builder()
                .title("Wicked: Câu Chuyện Phù Thủy Phương Tây")
                .tagline("Ai cũng xứng đáng có cơ hội được cất cánh bay cao.")
                .synopsis("Tại xứ sở Oz nhiệm màu, tình bạn kỳ lạ nhưng sâu sắc giữa Elphaba – cô gái thông minh mang làn da xanh lá bị hiểu lầm – và Glinda – tiểu thư tóc vàng nổi tiếng – dần bị thử thách bởi quyền lực của Phù thủy tối cao xứ Oz.")
                .director("Jon M. Chu")
                .cast(List.of("Cynthia Erivo", "Ariana Grande", "Jonathan Bailey", "Michelle Yeoh", "Jeff Goldblum"))
                .genres(List.of("Fantasy", "Drama", "Romance"))
                .formats(List.of("IMAX", "3D", "Dolby Atmos"))
                .durationMinutes(160)
                .ageRating("P")
                .status("COMING_SOON")
                .rating(9.1)
                .votesCount("52.6k")
                .themeColor("#047857")
                .accentColor("#F472B6")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/6COmYeLsz4c")
                .build());

        // 16. The Batman: Vạch Trần Sự Thật (ENDED)
        Movie m16 = movieRepository.save(Movie.builder()
                .title("The Batman: Vạch Trần Sự Thật")
                .tagline("Sự thật ẩn sau lớp mặt nạ của thành phố Gotham.")
                .synopsis("Trong năm thứ hai chiến đấu chống tội phạm tại Gotham, Hiệp sĩ Bóng đêm Bruce Wayne lần theo chuỗi mật thư đẫm máu của tên sát nhân hàng loạt Riddler, qua đó phơi bày mạng lưới tham nhũng liên quan đến chính gia tộc Wayne.")
                .director("Matt Reeves")
                .cast(List.of("Robert Pattinson", "Zoë Kravitz", "Paul Dano", "Colin Farrell", "Jeffrey Wright"))
                .genres(List.of("Crime", "Mystery", "Action"))
                .formats(List.of("IMAX", "Dolby Atmos", "VIP"))
                .durationMinutes(176)
                .ageRating("T16")
                .status("ENDED")
                .rating(9.2)
                .votesCount("124.0k")
                .themeColor("#B91C1C")
                .accentColor("#F87171")
                .featured(false)
                .posterUrl("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=85")
                .backdropUrl("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=85")
                .trailerVideoUrl("https://www.youtube.com/embed/mqqft2x_Aa4")
                .build());

        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        // Cinema 01 showtimes (Today)
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m1.getId(), "Cinema 01", "IMAX",
                LocalDateTime.of(today, LocalTime.of(9, 0)), 85000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m1.getId(), "Cinema 01", "IMAX",
                LocalDateTime.of(today, LocalTime.of(13, 0)), 95000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m2.getId(), "Cinema 01", "4DX",
                LocalDateTime.of(today, LocalTime.of(17, 0)), 100000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m3.getId(), "Cinema 01", "IMAX",
                LocalDateTime.of(today, LocalTime.of(20, 30)), 110000
        ));

        // Cinema 02 showtimes (Today)
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m4.getId(), "Cinema 02", "Dolby Atmos",
                LocalDateTime.of(today, LocalTime.of(9, 30)), 80000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m5.getId(), "Cinema 02", "Dolby Atmos",
                LocalDateTime.of(today, LocalTime.of(13, 0)), 85000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m6.getId(), "Cinema 02", "4DX",
                LocalDateTime.of(today, LocalTime.of(16, 30)), 95000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m4.getId(), "Cinema 02", "VIP",
                LocalDateTime.of(today, LocalTime.of(20, 0)), 105000
        ));

        // Cinema 03 showtimes (Today)
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m7.getId(), "Cinema 03", "3D",
                LocalDateTime.of(today, LocalTime.of(9, 0)), 75000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m8.getId(), "Cinema 03", "IMAX",
                LocalDateTime.of(today, LocalTime.of(12, 0)), 100000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m9.getId(), "Cinema 03", "4DX",
                LocalDateTime.of(today, LocalTime.of(16, 15)), 90000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m10.getId(), "Cinema 03", "3D",
                LocalDateTime.of(today, LocalTime.of(19, 30)), 90000
        ));

        // Cinema 04 showtimes (Today)
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m11.getId(), "Cinema 04", "Dolby Atmos",
                LocalDateTime.of(today, LocalTime.of(10, 0)), 80000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m12.getId(), "Cinema 04", "IMAX",
                LocalDateTime.of(today, LocalTime.of(13, 30)), 100000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m2.getId(), "Cinema 04", "VIP",
                LocalDateTime.of(today, LocalTime.of(17, 30)), 105000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m12.getId(), "Cinema 04", "VIP",
                LocalDateTime.of(today, LocalTime.of(20, 45)), 110000
        ));

        // Tomorrow showtimes
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m1.getId(), "Cinema 01", "IMAX",
                LocalDateTime.of(tomorrow, LocalTime.of(10, 0)), 90000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m2.getId(), "Cinema 01", "4DX",
                LocalDateTime.of(tomorrow, LocalTime.of(14, 0)), 95000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m3.getId(), "Cinema 01", "IMAX",
                LocalDateTime.of(tomorrow, LocalTime.of(18, 0)), 105000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m4.getId(), "Cinema 02", "VIP",
                LocalDateTime.of(tomorrow, LocalTime.of(15, 0)), 95000
        ));
        showtimeService.createShowtime(new CreateShowtimeRequest(
                m8.getId(), "Cinema 03", "IMAX",
                LocalDateTime.of(tomorrow, LocalTime.of(19, 0)), 105000
        ));
    }
}
