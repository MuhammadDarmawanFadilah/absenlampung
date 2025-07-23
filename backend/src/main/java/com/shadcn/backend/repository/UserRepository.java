package com.shadcn.backend.repository;

import com.shadcn.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsernameOrEmail(String username, String email);
      @Query("SELECT u FROM User u LEFT JOIN FETCH u.biografi WHERE u.username = :username OR u.email = :username")
    Optional<User> findByUsernameOrEmailWithBiografi(@Param("username") String username);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.biografi WHERE u.id = :id")
    Optional<User> findByIdWithBiografi(@Param("id") Long id);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.biografi b " +
           "LEFT JOIN FETCH b.workExperiences " +
           "LEFT JOIN FETCH b.achievements " +
           "LEFT JOIN FETCH b.academicRecords " +
           "LEFT JOIN FETCH b.spesialisasiKedokteran " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithBiografiAndRelations(@Param("id") Long id);
    
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    List<User> findByStatus(User.UserStatus status);
    
    Page<User> findByStatus(User.UserStatus status, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.status = :status AND " +
           "(u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%)")
    Page<User> findByStatusAndSearchTerms(@Param("status") User.UserStatus status, 
                                         @Param("search") String search, 
                                         Pageable pageable);
    
    long countByStatus(User.UserStatus status);
      @Query("SELECT u FROM User u WHERE u.fullName LIKE %:name% OR u.username LIKE %:name%")
    List<User> findByNameContaining(@Param("name") String name);
    
    @Query("SELECT u FROM User u WHERE " +
           "u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%")
    Page<User> findBySearchTermsIgnoreCase(@Param("search") String search, Pageable pageable);
      
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.biografi WHERE " +
           "(:search IS NULL OR u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%) AND " +
           "(:roleId IS NULL OR u.role.roleId = :roleId) AND " +
           "(:status IS NULL OR u.status = :status)")
    Page<User> findUsersWithFilters(@Param("search") String search, 
                                   @Param("roleId") Long roleId, 
                                   @Param("status") User.UserStatus status, 
                                   Pageable pageable);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhoneNumber(String phoneNumber);
      
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.phoneNumber = :phoneNumber AND u.id != :userId")
    boolean existsByPhoneNumberAndIdNot(@Param("phoneNumber") String phoneNumber, @Param("userId") Long userId);
      // Dashboard methods
    @Query("SELECT u FROM User u WHERE u.updatedAt >= :startOfMonth ORDER BY u.updatedAt DESC")
    List<User> findUsersLoggedInThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.updatedAt >= :startOfMonth")
    Long countActiveUsers(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.updatedAt >= :startOfMonth")
    Long countLoginsThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.updatedAt BETWEEN :start AND :end")
    Long countLoginsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    List<User> findTop5ByOrderByUpdatedAtDesc();

    // Methods for users created through public registration only
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.biografi b WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status")
    List<User> findByStatusAndPublicRegistrationWithBasicBiografi(@Param("status") User.UserStatus status);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.biografi b WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status")
    Page<User> findByStatusAndPublicRegistrationWithBasicBiografi(@Param("status") User.UserStatus status, Pageable pageable);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.biografi b WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status AND " +
           "(u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%)")
    Page<User> findByStatusAndSearchTermsAndPublicRegistrationWithBasicBiografi(@Param("status") User.UserStatus status, 
                                                              @Param("search") String search, 
                                                              Pageable pageable);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.biografi b WHERE u.publicInvitationLink IS NOT NULL AND " +
           "(u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%)")
    Page<User> findBySearchTermsAndPublicRegistrationWithBasicBiografi(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.biografi b WHERE u.publicInvitationLink IS NOT NULL")
    Page<User> findByPublicRegistrationWithBasicBiografi(Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status")
    List<User> findByStatusAndPublicRegistration(@Param("status") User.UserStatus status);
    
    @Query("SELECT u FROM User u WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status")
    Page<User> findByStatusAndPublicRegistration(@Param("status") User.UserStatus status, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status AND " +
           "(u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%)")
    Page<User> findByStatusAndSearchTermsAndPublicRegistration(@Param("status") User.UserStatus status, 
                                                              @Param("search") String search, 
                                                              Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.publicInvitationLink IS NOT NULL AND " +
           "u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%")
    Page<User> findBySearchTermsAndPublicRegistration(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.publicInvitationLink IS NOT NULL")
    Page<User> findByPublicRegistration(Pageable pageable);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.publicInvitationLink IS NOT NULL AND u.status = :status")
    long countByStatusAndPublicRegistration(@Param("status") User.UserStatus status);
    
    // Method to find users by biografi ID for cascade deletion
    @Query("SELECT u FROM User u WHERE u.biografi.id = :biografiId")
    List<User> findByBiografiId(@Param("biografiId") Long biografiId);
}
