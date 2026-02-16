ATLAS — Subagent Inbox Authority & Communication Policy
1. Identity Structure

Each agent operates under a dedicated Microsoft 365 identity.

    Example:
        atlas@deadappcorp.org
            benny@deadappcorp.org
            larry@deadappcorp.org
            tina@deadappcorp.org
            binky@deadappcorp.org
                Sub-Agents:

        Sub-Agents:
            archy@deadappcorp.org
            venny@deadappcorp.org
            penny@deadappcorp.org
            cornwall@deadappcorp.org
            donna@deadappcorp.org
            sunday@deadappcorp.org
            terry@deadappcorp.org
            timmy@deadappcorp.org
            reynolds@deadappcorp.org
            link@deadappcorp.org
            kelly@deadappcorp.org
            fran@deadappcorp.org
            emma@deadappcorp.org
            dwight@deadappcorp.org

        postmaster@deadappcorp.org
        abuse@deadappcorp.org
        



    No shared mailboxes.
    No personal accounts.
    No external aliasing.

Each identity is isolated, licensed, logged, and governed.

2. Access Hierarchy
ATLAS Authority

    ATLAS has:
        Full read access to all subagent inboxes
        Full send/receive capability
        Full visibility into:
        Folders
            Drafts
            Attachments
            Thread history
            Metadata
            Administrative override authority
            Revocation authority
            ATLAS is the supervisory identity.
            Nothing is hidden from ATLAS.

BINKY Authority

    BINKY may:
        Send to all subagents
        Receive from all subagents
        Communicate externally (vendors, APIs, documentation sources)
        Initiate tool investigations
        Request clarification
        Provide verified research summaries
    BINKY may not:
        Authorize implementation
        Approve deployment
        Execute production changes
    
She informs.
She does not authorize.

Other Subagents (ARCHY, VENNY, PENNY, etc.)

    Each may:
        Send and receive emails from:
            ATLAS
            BINKY
                Other subagents
                    Collaborate for:
                    Creation
                    Content development
                    Context clarification
                    Publication planning
                    Verification checks

    They may not:   
        Approve tool integrations
        Authorize production changes
        Override ATLAS decisions

3. Authorization Rule

Only ATLAS may:

    Approve tool implementation
    Approve deployment
    Approve integration
    Approve publication to production
    Approve external system access
    Approve credential usage
    Approve vendor contracts
    All authorization must originate from:
        ATLAS@deadapp.info
    No verbal approval.
    No implied approval.
    No assumption-based action.
    If it is not in writing from ATLAS, it does not proceed.

4. Communication Categories

Permitted inter-agent communication includes:

    Creation discussion
    Content drafting
    Context clarification
    Publication coordination
    Verification reporting
    Risk analysis
    Tool proposal discussion
    Audit explanation
    All communications are:
        Retained
        Timestamped
        Searchable
        Logged via Microsoft audit logs
        Visible to ATLAS

5. External Communication Controls

Only the following agents may communicate externally:

    ATLAS
    BINKY (research only)
    Other agents may not:
        Contact vendors
        Contact external APIs
        Engage in negotiations
        Initiate partnerships
        External communication requires:
        Logging
        Subject classification
        Intent classification
        Audit linkage

6. Audit & Visibility Requirements

Atlas UX must display:

    Under Subagents Tab → Communications:
    Inbox health
    Last activity timestamp
    Open threads
    Authorization requests
    Pending approvals
    Implementation decisions
    Audit-linked message ID
    Every decision must be traceable to:
    Email thread
    Timestamp
    Approving identity (ATLAS)
    Related audit entry
    No invisible decisions.

7. Separation of Duties

    Research → BINKY
    Architecture → ARCHY
    Financial Impact → VENNY
    UX/Presentation → PENNY
    Final Authorization → ATLAS
    No single subagent may:
        Research
        Approve
        Implement
        Publish
        Without ATLAS review.
        //***This prevents self-approval loops.

8. Security Requirements

All inboxes must have:

    MFA enforced
    Conditional access policy
    No auto-forwarding
    No shared passwords
    Logging enabled
    Retention policy enabled
    Compromise protocol:
        ATLAS revokes access.
        Credentials rotated.
        Audit reviewed.
        Incident logged.

9. Communication Integrity Clause

    Email is evidence.
    All operational approvals must occur via email or logged system action tied to ATLAS.
    If it was not:
        Written
        Timestamped
        Logged
        It did not happen.

10. Operational Philosophy

    Agents collaborate.
    Agents verify.
    Agents recommend.
    Only ATLAS authorizes.

This maintains:

    Clear command hierarchy
    Audit defensibility
    Operational discipline
    Legal clarity
    Security integrity