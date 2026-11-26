package com.vsc.jobcard.repository;

import com.vsc.jobcard.entity.JobCard;
import com.vsc.jobcard.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface JobCardRepository extends JpaRepository<JobCard, Long> {
    boolean existsByJobCardNumber(String jobCardNumber);
    boolean existsByBooking_Id(Long bookingId);
    boolean existsByTechnician_Id(Long technicianId);
    List<JobCard> findByJobStatus(JobStatus jobStatus);

    @Query("select count(j) from JobCard j where j.jobStatus = :status")
    long countByStatus(@Param("status") JobStatus status);

    @Query("select j from JobCard j where j.promisedDate < :today and j.jobStatus not in :excluded order by j.promisedDate, j.id")
    List<JobCard> findOverdue(@Param("today") LocalDate today, @Param("excluded") List<JobStatus> excluded);

    @Query("select j from JobCard j where j.promisedDate >= :today and j.jobStatus not in :excluded order by j.promisedDate, j.id")
    List<JobCard> findUpcoming(@Param("today") LocalDate today, @Param("excluded") List<JobStatus> excluded);

    @Query("select j from JobCard j where j.jobStatus in :statuses order by j.promisedDate, j.id")
    List<JobCard> findByStatuses(@Param("statuses") List<JobStatus> statuses);
}
