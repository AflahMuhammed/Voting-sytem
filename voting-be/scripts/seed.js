require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import ALL models
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Admin = require('../models/Admin');
const EmailLog = require('../models/EmailLog');
const Report = require('../models/Report');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Election.deleteMany({});
    await Candidate.deleteMany({});
    await Admin.deleteMany({});
    await EmailLog.deleteMany({});
    await Report.deleteMany({});

    console.log('✅ Cleared all existing data');

    // Create users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Regular user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user'
    });

    // Admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Create admin record
    await Admin.create({
      userId: adminUser._id,
      permissions: {
        canManageElections: true,
        canApproveCandidates: true,
        canViewReports: true,
        canSendEmails: true
      }
    });

    // Create elections with different statuses
    console.log('🗳️  Creating elections...');
    
    // Active election
    const activeElection = await Election.create({
      title: 'Student Council Election 2024',
      description: 'Annual student council election - Vote for your representatives!',
      startDate: new Date(), // Starts now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
      createdBy: adminUser._id,
      status: 'published',
      votingStatus: 'active',
      isActive: true,
      settings: {
        allowCandidateRegistration: true,
        requireCandidateApproval: true,
        maxCandidates: 8,
        votingMethod: 'first-past-the-post'
      },
      location: 'Main Campus',
      eligibleVoters: 500,
      tags: ['student', 'council', '2024']
    });

    // Upcoming election
    const upcomingElection = await Election.create({
      title: 'Sports Committee Election 2024',
      description: 'Elect your sports committee representatives',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Starts in 3 days
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Ends in 10 days
      createdBy: adminUser._id,
      status: 'published',
      votingStatus: 'upcoming',
      isActive: true,
      settings: {
        allowCandidateRegistration: true,
        requireCandidateApproval: false,
        maxCandidates: 5
      },
      location: 'Sports Complex',
      eligibleVoters: 200,
      tags: ['sports', 'committee']
    });

    // Draft election (for admin testing)
    const draftElection = await Election.create({
      title: 'Cultural Fest Organizers 2024',
      description: 'Select organizers for the annual cultural fest',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id,
      status: 'draft',
      votingStatus: 'upcoming',
      isActive: true,
      settings: {
        allowCandidateRegistration: false, // Not open yet
        requireCandidateApproval: true,
        maxCandidates: 6
      },
      location: 'Auditorium',
      eligibleVoters: 150,
      tags: ['cultural', 'fest', 'organizers']
    });

    // Create candidates with different statuses
    console.log('👥 Creating candidates...');
    
    // Approved candidates for active election
    const approvedCandidates = await Candidate.create([
      {
        name: 'Alice Johnson',
        description: 'Computer Science Major - Focus on campus technology improvements and digital innovation',
        electionId: activeElection._id,
        userId: user._id,
        status: 'approved',
        isApproved: true,
        nominationDate: new Date(),
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        photo: null,
        manifesto: 'I will work to improve campus WiFi, upgrade computer labs, and create more tech workshops for students.',
        contactEmail: 'alice@example.com',
        tags: ['technology', 'innovation', 'cs-major']
      },
      {
        name: 'Bob Smith',
        description: 'Business Administration - Focus on student entrepreneurship and career development',
        electionId: activeElection._id,
        userId: user._id,
        status: 'approved',
        isApproved: true,
        nominationDate: new Date(),
        approvedBy: adminUser._id,
        approvalDate: new Date(),
        manifesto: 'My platform includes creating more internship opportunities, business workshops, and startup support for students.',
        contactEmail: 'bob@example.com',
        tags: ['business', 'entrepreneurship', 'career']
      }
    ]);

    // Pending candidates for active election (for admin approval testing)
    const pendingCandidates = await Candidate.create([
      {
        name: 'Carol Davis',
        description: 'Political Science - Focus on student advocacy and campus community building',
        electionId: activeElection._id,
        userId: user._id,
        status: 'pending',
        isApproved: false,
        nominationDate: new Date(),
        manifesto: 'I will advocate for better student representation, improved campus facilities, and more social events.',
        contactEmail: 'carol@example.com',
        tags: ['advocacy', 'community', 'politics']
      },
      {
        name: 'David Wilson',
        description: 'Environmental Science - Focus on sustainability and green campus initiatives',
        electionId: activeElection._id,
        userId: user._id,
        status: 'pending',
        isApproved: false,
        nominationDate: new Date(),
        manifesto: 'My goals include implementing recycling programs, reducing plastic use, and creating campus gardens.',
        contactEmail: 'david@example.com',
        tags: ['sustainability', 'environment', 'green']
      }
    ]);

    // Rejected candidate (for testing)
    const rejectedCandidate = await Candidate.create({
      name: 'Eve Brown',
      description: 'Arts Major - Focus on creative expression and arts funding',
      electionId: activeElection._id,
      userId: user._id,
      status: 'rejected',
      isApproved: false,
      nominationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      approvedBy: adminUser._id,
      approvalDate: new Date(),
      rejectionReason: 'Application submitted after the deadline',
      contactEmail: 'eve@example.com',
      tags: ['arts', 'creative', 'funding']
    });

    // Create sample email logs (Member 4)
    console.log('📧 Creating sample email logs...');
    const emailLogs = await EmailLog.create([
      {
        userId: user._id,
        electionId: activeElection._id,
        type: 'vote_confirmation',
        subject: '✅ Vote Confirmation - Student Council Election 2024',
        content: 'Thank you for voting in the Student Council Election!',
        status: 'sent',
        sentAt: new Date()
      },
      {
        userId: user._id,
        electionId: activeElection._id,
        type: 'candidate_approval',
        subject: '🎉 Candidate Application Approved',
        content: 'Your candidate application has been approved!',
        status: 'sent',
        sentAt: new Date()
      }
    ]);

    // Create sample reports (Member 4)
    console.log('📊 Creating sample reports...');
    const sampleReport = await Report.create({
      title: 'Voting Summary Report - Student Council 2024',
      description: 'Initial voting summary for the student council election',
      electionId: activeElection._id,
      type: 'voting_summary',
      generatedBy: adminUser._id,
      data: {
        totalVotes: 0,
        totalCandidates: 4,
        votingRate: 0,
        candidates: [
          { name: 'Alice Johnson', votes: 0, status: 'approved' },
          { name: 'Bob Smith', votes: 0, status: 'approved' },
          { name: 'Carol Davis', votes: 0, status: 'pending' },
          { name: 'David Wilson', votes: 0, status: 'pending' }
        ]
      },
      format: 'json',
      isPublic: true
    });

    console.log('✅ Seed data created successfully!');
    
    // Display summary
    console.log('\n📋 SEED DATA SUMMARY:');
    console.log('================================');
    
    console.log('\n👥 USERS:');
    console.log(`   👤 Regular User: ${user.name} (${user.email})`);
    console.log(`      ID: ${user._id}`);
    console.log(`      Role: ${user.role}`);
    console.log(`   👑 Admin User: ${adminUser.name} (${adminUser.email})`);
    console.log(`      ID: ${adminUser._id}`);
    console.log(`      Role: ${adminUser.role}`);
    
    console.log('\n🗳️  ELECTIONS:');
    console.log(`   ✅ Active: ${activeElection.title}`);
    console.log(`      ID: ${activeElection._id}`);
    console.log(`      Status: ${activeElection.status}`);
    console.log(`      Voting: ${activeElection.votingStatus}`);
    
    console.log(`   ⏰ Upcoming: ${upcomingElection.title}`);
    console.log(`      ID: ${upcomingElection._id}`);
    
    console.log(`   📝 Draft: ${draftElection.title}`);
    console.log(`      ID: ${draftElection._id}`);
    
    console.log('\n👥 CANDIDATES:');
    console.log(`   ✅ Approved: ${approvedCandidates.length} candidates`);
    approvedCandidates.forEach(candidate => {
      console.log(`      - ${candidate.name} (${candidate.status})`);
    });
    
    console.log(`   ⏳ Pending Approval: ${pendingCandidates.length} candidates`);
    pendingCandidates.forEach(candidate => {
      console.log(`      - ${candidate.name} (${candidate.status})`);
    });
    
    console.log(`   ❌ Rejected: 1 candidate`);
    console.log(`      - ${rejectedCandidate.name} (${rejectedCandidate.status})`);
    
    console.log('\n📧 EMAIL LOGS:');
    console.log(`   Created: ${emailLogs.length} sample email logs`);
    
    console.log('\n📊 REPORTS:');
    console.log(`   Created: 1 sample report`);
    
    console.log('\n💡 TESTING INFORMATION:');
    console.log('================================');
    console.log('🔐 Login Credentials:');
    console.log('   Regular User: test@example.com / password123');
    console.log('   Admin User: admin@example.com / password123');
    
    console.log('\n🛠️  Admin Features to Test:');
    console.log('   • Go to /admin routes with admin user');
    console.log('   • Approve/reject pending candidates');
    console.log('   • Manage elections');
    console.log('   • Generate reports');
    console.log('   • View email logs');
    
    console.log('\n🗳️  Voting Features:');
    console.log('   • Login as regular user to vote');
    console.log('   • Test the complete voting flow');
    console.log('   • View results');

    // Close connection
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
    console.log('\n🎉 Seed completed! Your database is ready with Member 2 & 4 features.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Run the seed function
seedData();