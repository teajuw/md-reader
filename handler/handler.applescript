-- Default app for .md files: hands the file to the md-reader session, then brings it forward.
on open theFiles
	set stateDir to (POSIX path of (path to home folder)) & ".claude/md-reader"
	set readerId to do shell script "cat " & quoted form of (stateDir & "/_session") & " 2>/dev/null || true"
	if readerId is "" then
		display dialog "No md-reader session found. Run /md-reader:start in Claude Code." buttons {"OK"} default button 1 with title "md-reader"
	else
		set filePath to POSIX path of (item -1 of theFiles)
		set fileName to do shell script "basename " & quoted form of filePath
		-- One note at a time, named after the file so the tree says what's coming.
		do shell script "find " & quoted form of stateDir & " -maxdepth 1 -name '_opening *' -delete"
		do shell script "printf %s " & quoted form of filePath & " > " & quoted form of (stateDir & "/_opening " & fileName)
		do shell script "open " & quoted form of ("claude://code/continue?session=" & readerId)
	end if
end open
