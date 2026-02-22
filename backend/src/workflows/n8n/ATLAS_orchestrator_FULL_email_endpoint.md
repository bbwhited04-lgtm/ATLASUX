# ATLAS Orchestrator - FULL (Email Endpoint)

## Workflow Overview

This workflow orchestrates the process of sending requests for intel, processing drafts, and handling approvals using n8n.

### Nodes

1. **Cron Daily**
   - Triggers every day at 8:05 AM.

2. **Set Meta**
   - Sets metadata such as `run_id`, `atlas_email`, and `audit_cc`.

3. **Build Agent Registry**
   - Constructs a registry of agents and their roles.

4. **Prep Intel Email**
   - Prepares an email for requesting intel from agents.

5. **Email Send: Intel Request**
   - Sends the intel request email.

6. **Wait: Intel Poll**
   - Waits for a specified duration before checking for replies.

7. **IMAP Search: Intel Replies**
   - Searches for replies to the intel request.

8. **Accumulate Intel**
   - Collects and processes the intel received.

9. **IF Intel Complete**
   - Checks if all required intel has been received.
   - If complete, proceeds to prepare the Binky summary.
   - If incomplete, checks if retries are less than 10.

10. **Prep Email: Binky Summary**
    - Prepares an email requesting a summary from Binky.

11. **Email Send: Binky Summary Request**
    - Sends the summary request email to Binky.

12. **Wait: Binky Poll**
    - Waits for a response from Binky.

13. **IMAP Search: Binky Reply**
    - Searches for the reply from Binky.

14. **Validate Binky JSON**
    - Validates the JSON response from Binky.

15. **IF Binky OK**
    - Checks if the Binky response is valid.
    - If valid, builds draft tasks.
    - If not, checks if retries are less than 10.

16. **Build Draft Tasks**
    - Constructs tasks for draft agents based on the Binky summary.

17. **Split Tasks**
    - Splits tasks into manageable batches for processing.

18. **Email Send: Draft Task**
    - Sends draft tasks to agents.

19. **Wait: Draft Poll**
    - Waits for draft responses.

20. **IMAP Search: Draft Replies**
    - Searches for replies from draft agents.

21. **Accumulate Drafts**
    - Collects drafts received from agents.

22. **IF Drafts Complete**
    - Checks if all drafts have been received.
    - If complete, sends review requests.
    - If not, checks if retries are less than 10.

23. **Email Send: Benny+Jenny Review Ping**
    - Sends a review request to Benny and Jenny.

24. **Email Send: Approval Request**
    - Sends an approval request email.

25. **Wait: Approval Poll**
    - Waits for a response to the approval request.

26. **IMAP Search: Approval Reply**
    - Searches for the approval reply.

27. **Parse Approval**
    - Parses the approval response to determine the decision.

28. **IF Approved**
    - Checks if the approval was granted.
    - If approved, prepares publish commands.
    - If denied, notifies the relevant parties.

29. **Prep Publish Command**
    - Prepares the command to publish approved assets.

30. **Email Send: Publish Commands**
    - Sends the publish command emails.

31. **Wait: Receipt Poll**
    - Waits for receipts from the publish command.

32. **IMAP Search: Publish Receipts**
    - Searches for receipts confirming publication.

33. **Accumulate Receipts**
    - Collects receipts from the responses.

34. **IF Receipts Complete**
    - Checks if all receipts have been received.
    - If complete, sends end-of-day audit emails.
    - If not, checks if retries are less than 10.

35. **Email Send: EOD Audit -> Larry**
    - Sends an end-of-day audit email to Larry.

36. **Email Send: EOD Finance -> Tina**
    - Sends an end-of-day finance review email to Tina.

## Connections

- Each node is connected sequentially, with conditional branches for handling retries and approvals, ensuring that the workflow can adapt to the responses received at each stage.

## Execution Settings

- **Execution Timeout**: 14400 seconds (4 hours)
- **Save Execution Progress**: True
- **Save Data on Error/Success**: All
