package com.cinema.booking.service;

import com.cinema.booking.dto.request.CreateVoucherRequest;
import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.model.Voucher;
import com.cinema.booking.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    public Voucher getVoucherByCode(String code) {
        return voucherRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BadRequestException("Mã giảm giá không tồn tại"));
    }

    public Voucher createVoucher(CreateVoucherRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new SeatConflictException("Mã giảm giá " + code + " đã tồn tại");
        }
        if (request.getExpiryDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày hết hạn phải sau ngày bắt đầu");
        }

        Voucher voucher = Voucher.builder()
                .code(code)
                .description(request.getDescription() != null ? request.getDescription() : "")
                .discountType(request.getDiscountType().toUpperCase())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderValue(request.getMinOrderValue())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .startDate(request.getStartDate())
                .expiryDate(request.getExpiryDate())
                .isActive(request.getIsActive() == null || request.getIsActive())
                .build();

        return voucherRepository.save(voucher);
    }

    public void deleteVoucher(String id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Voucher với ID: " + id));
        voucherRepository.delete(voucher);
    }

    /**
     * Thuật toán 4: Kiểm tra tính hợp lệ của Voucher & Tính giá vé Động + Khuyến mãi có Trần
     */
    public double validateAndCalculateDiscount(Voucher voucher, double originalAmount) {
        LocalDateTime now = LocalDateTime.now();

        if (!voucher.isActive()) {
            throw new BadRequestException("Mã giảm giá đang bị khóa hoặc ngừng kích hoạt");
        }
        if (now.isBefore(voucher.getStartDate())) {
            throw new BadRequestException("Mã giảm giá chưa tới ngày áp dụng");
        }
        if (now.isAfter(voucher.getExpiryDate())) {
            throw new BadRequestException("Mã giảm giá đã hết hạn sử dụng");
        }
        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
        }
        if (originalAmount < voucher.getMinOrderValue()) {
            throw new BadRequestException(String.format(
                    "Tổng tiền ghế (%.0fđ) chưa đạt mức tối thiểu (%.0fđ) để áp dụng mã %s",
                    originalAmount, voucher.getMinOrderValue(), voucher.getCode()
            ));
        }

        double discount;
        if ("FIXED".equalsIgnoreCase(voucher.getDiscountType())) {
            discount = voucher.getDiscountValue();
        } else if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
            double rawPercentDiscount = originalAmount * (voucher.getDiscountValue() / 100.0);
            if (voucher.getMaxDiscountAmount() != null && voucher.getMaxDiscountAmount() > 0) {
                discount = Math.min(rawPercentDiscount, voucher.getMaxDiscountAmount());
            } else {
                discount = rawPercentDiscount;
            }
        } else {
            throw new BadRequestException("Loại khuyến mãi không hợp lệ: " + voucher.getDiscountType());
        }

        return Math.min(originalAmount, Math.max(0.0, discount));
    }
}

