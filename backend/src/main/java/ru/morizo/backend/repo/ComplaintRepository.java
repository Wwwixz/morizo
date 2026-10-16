package ru.morizo.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.morizo.backend.entity.Complaint;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findByStatusOrderByCreatedAtDesc(Complaint.Status status);
}
