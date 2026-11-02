-- Default app for .md files: hands the file to the md-reader session, then brings it forward.
on open theFiles
	set stateDir to (POSIX path of (path to home folder)) & ".claude/md-reader"
	do shell script "mkdir -p " & quoted form of stateDir
	do shell script "printf %s " & quoted form of (POSIX path of (item -1 of theFiles)) & " > " & quoted form of (stateDir & "/pending")
	set readerId to do shell script "cat " & quoted form of (stateDir & "/reader") & " 2>/dev/null || true"
	if readerId is "" then
		display dialog "No md-reader session found. Run /md-reader:start in Claude Code." buttons {"OK"} default button 1 with title "md-reader"
	else
		do shell script "open " & quoted form of ("claude://code/continue?session=" & readerId)
	end if
end open
