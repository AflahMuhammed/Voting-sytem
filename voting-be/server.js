import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/school_voting', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
    collegeId: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    class: String,
    role: { type: String, default: 'student' },
    isActive: { type: Boolean, default: true },
    votesCast: { type: Number, default: 0 },
    joinedDate: { type: Date, default: Date.now }
});

// Election Schema
const electionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    createdAt: { type: Date, default: Date.now }
});

// Candidate Schema
const candidateSchema = new mongoose.Schema({
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    position: { type: String, required: true },
    slogan: String,
    status: { type: String, default: 'active' },
    voteCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Vote Schema
const voteSchema = new mongoose.Schema({
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    votedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
const Election = mongoose.model('Election', electionSchema);
const Candidate = mongoose.model('Candidate', candidateSchema);
const Vote = mongoose.model('Vote', voteSchema);

// Simple token verification (for demo)
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    const userEmail = req.headers['user-email'];
    
    if (userEmail && userEmail === 'admin@votingapp.com') {
        next();
    } else {
        return res.status(403).json({ error: 'Admin access required' });
    }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date(),
        database: 'MongoDB connected'
    });
});

// Student Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log('📝 Signup request:', req.body);
        
        const { firstName, lastName, collegeId, email, password, class: studentClass } = req.body;

        // Check if student already exists
        const existingStudent = await Student.findOne({
            $or: [{ email }, { collegeId }]
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                error: 'Student with this email or college ID already exists'
            });
        }

        // Create new student
        const student = new Student({
            firstName,
            lastName,
            collegeId,
            email,
            password,
            class: studentClass,
            role: email === 'admin@votingapp.com' ? 'admin' : 'student'
        });

        await student.save();
        console.log('✅ Student created:', student.email);

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            user: {
                id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                collegeId: student.collegeId,
                email: student.email,
                class: student.class,
                role: student.role
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login request:', req.body.email);
        
        const { email, password } = req.body;

        // Find user
        const student = await Student.findOne({ email, isActive: true });
        
        if (!student) {
            console.log('❌ Student not found:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Check password
        if (student.password !== password) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        console.log('✅ Login successful:', email);
        
        res.json({
            success: true,
            user: {
                id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                collegeId: student.collegeId,
                email: student.email,
                class: student.class,
                role: student.role,
                votesCast: student.votesCast
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// ADMIN ROUTES

// Get all students (Admin only)
app.get('/api/admin/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const students = await Student.find({}, '-password');
        
        res.json({
            success: true,
            students: students.map(student => ({
                id: student._id,
                collegeId: student.collegeId,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                class: student.class,
                role: student.role,
                isActive: student.isActive,
                votesCast: student.votesCast,
                joinedDate: student.joinedDate
            }))
        });
    } catch (error) {
        console.error('❌ Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create election (Admin only)
app.post('/api/admin/elections', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, description, startDate, endDate } = req.body;

        const election = new Election({
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            createdBy: req.headers['user-id'], // In real app, get from JWT
            status: 'active'
        });

        await election.save();
        console.log('✅ Election created:', title);

        res.status(201).json({
            success: true,
            message: 'Election created successfully',
            election: {
                id: election._id,
                title: election.title,
                description: election.description,
                startDate: election.startDate,
                endDate: election.endDate,
                status: election.status
            }
        });

    } catch (error) {
        console.error('❌ Create election error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Get all elections (Admin only)
app.get('/api/admin/elections', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const elections = await Election.find().populate('createdBy', 'firstName lastName');
        
        res.json({
            success: true,
            elections: elections.map(election => ({
                id: election._id,
                title: election.title,
                description: election.description,
                startDate: election.startDate,
                endDate: election.endDate,
                status: election.status,
                createdBy: election.createdBy ? `${election.createdBy.firstName} ${election.createdBy.lastName}` : 'Unknown'
            }))
        });
    } catch (error) {
        console.error('❌ Get elections error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add candidate (Admin only)
app.post('/api/admin/candidates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { electionId, studentId, position, slogan } = req.body;

        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ error: 'Election not found' });
        }

        // Check if student is already a candidate in this election
        const existingCandidate = await Candidate.findOne({
            electionId,
            studentId
        });

        if (existingCandidate) {
            return res.status(400).json({
                error: 'This student is already a candidate in this election'
            });
        }

        const candidate = new Candidate({
            electionId,
            studentId,
            position,
            slogan
        });

        await candidate.save();
        console.log('✅ Candidate added:', student.firstName, 'for', election.title);

        res.status(201).json({
            success: true,
            message: 'Candidate added successfully',
            candidate: {
                id: candidate._id,
                electionId: candidate.electionId,
                student: {
                    id: candidate.studentId,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    collegeId: student.collegeId,
                    email: student.email
                },
                position: candidate.position,
                slogan: candidate.slogan,
                status: candidate.status
            }
        });

    } catch (error) {
        console.error('❌ Add candidate error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Get all candidates (Admin only)
app.get('/api/admin/candidates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .populate('electionId', 'title')
            .populate('studentId', 'firstName lastName collegeId email');
        
        res.json({
            success: true,
            candidates: candidates.map(candidate => ({
                id: candidate._id,
                election: candidate.electionId.title,
                student: {
                    id: candidate.studentId._id,
                    name: `${candidate.studentId.firstName} ${candidate.studentId.lastName}`,
                    collegeId: candidate.studentId.collegeId,
                    email: candidate.studentId.email
                },
                position: candidate.position,
                slogan: candidate.slogan,
                status: candidate.status,
                voteCount: candidate.voteCount
            }))
        });
    } catch (error) {
        console.error('❌ Get candidates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// STUDENT ROUTES

// Get elections for student
app.get('/api/student/elections', authenticateToken, async (req, res) => {
    try {
        const elections = await Election.find({
            status: 'active',
            endDate: { $gte: new Date() } // Not ended yet
        }).populate('createdBy', 'firstName lastName');

        res.json({
            success: true,
            elections: elections.map(election => ({
                id: election._id,
                title: election.title,
                description: election.description,
                startDate: election.startDate,
                endDate: election.endDate,
                status: election.status,
                createdBy: election.createdBy ? `${election.createdBy.firstName} ${election.createdBy.lastName}` : 'Unknown'
            }))
        });
    } catch (error) {
        console.error('❌ Get student elections error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// VOTING ROUTES

// Get candidates for an election
app.get('/api/votes/elections/:electionId/candidates', authenticateToken, async (req, res) => {
    try {
        const candidates = await Candidate.find({ 
            electionId: req.params.electionId,
            status: 'active'
        }).populate('studentId', 'firstName lastName collegeId');

        res.json({
            success: true,
            candidates: candidates.map(candidate => ({
                id: candidate._id,
                student: {
                    id: candidate.studentId._id,
                    name: `${candidate.studentId.firstName} ${candidate.studentId.lastName}`,
                    collegeId: candidate.studentId.collegeId
                },
                position: candidate.position,
                slogan: candidate.slogan,
                voteCount: candidate.voteCount
            }))
        });
    } catch (error) {
        console.error('❌ Get election candidates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cast a vote
app.post('/api/votes/cast', authenticateToken, async (req, res) => {
    try {
        const { electionId, candidateId } = req.body;
        const studentId = req.headers['user-id']; // In real app, get from JWT

        // Check if student has already voted in this election
        const existingVote = await Vote.findOne({ electionId, studentId });
        if (existingVote) {
            return res.status(400).json({ error: 'You have already voted in this election' });
        }

        // Create vote
        const vote = new Vote({
            electionId,
            candidateId,
            studentId
        });

        await vote.save();

        // Update candidate vote count
        await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

        // Update student's votes cast count
        await Student.findByIdAndUpdate(studentId, { $inc: { votesCast: 1 } });

        console.log('✅ Vote cast by student:', studentId);

        res.json({
            success: true,
            message: 'Vote cast successfully'
        });

    } catch (error) {
        console.error('❌ Cast vote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get election results
app.get('/api/votes/elections/:electionId/results', authenticateToken, async (req, res) => {
    try {
        const candidates = await Candidate.find({ 
            electionId: req.params.electionId 
        })
        .populate('studentId', 'firstName lastName collegeId')
        .sort({ voteCount: -1 });

        res.json({
            success: true,
            results: candidates.map(candidate => ({
                candidate: {
                    id: candidate.studentId._id,
                    name: `${candidate.studentId.firstName} ${candidate.studentId.lastName}`,
                    collegeId: candidate.studentId.collegeId
                },
                position: candidate.position,
                voteCount: candidate.voteCount
            }))
        });
    } catch (error) {
        console.error('❌ Get results error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize admin user
const initializeAdmin = async () => {
    try {
        const adminExists = await Student.findOne({ email: 'admin@votingapp.com' });
        if (!adminExists) {
            const admin = new Student({
                collegeId: 'ADMIN001',
                firstName: 'System',
                lastName: 'Administrator',
                email: 'admin@votingapp.com',
                password: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Admin user created');
        } else {
            console.log('✅ Admin user already exists');
        }
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
};

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await initializeAdmin();
    console.log('📊 Voting System Backend Ready!');
});