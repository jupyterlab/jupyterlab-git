# Contributing

You can contribute in many ways to move this project forward.

While anyone can contribute, only [Team Members](https://github.com/jupyterlab/jupyterlab-git#team) can merge in pull requests
or add labels to issues.

Here we outline how the different contribution processes play out in practice for this project.
The goal is to be transparent about these, so that anyone can see how to participate.

If you have suggestions on how these processes can be improved, please suggest that (see "Enhancement Request" below)!

## Bug Report

If you are using this software and encounter some behavior that is unexpected, then you may have come across a bug!
To get this fixed, first creation an issue that should have, ideally:

* The behavior you expected
* The actual behavior (screenshots can be helpful here)
* How someone else could reproduce it (version of the software, as well as your browser and OS can help)

Once you create this issue, someone with commit rights should come by and try to reproduce the issue locally and comment if they are able to. If they are able to, then they will add the `type:Bug` label. If they are not able to, then they will add the `status: Needs info` label and wait for information from you.

Hopefully, then some nice person will come by to fix your bug! This will likely be someone who already works on the project,
but it could be anyone.

They will fix the bug locally, then push those changes to their fork. Then they will make a pull request, and in the description
say "This fixes bug #xxx". 

Someone who maintains the repo will review this change, and this can lead to some more back and forth about the implementation.

Finally, once at least one person with commit rights is happy with the change, and there aren't any objections, they will merge
it in.

## Enhancement Request

Maybe the current behavior isn't wrong, but you still have an idea on how it could be improved.

The flow will be similar to opening a bug, but the process could be longer, as we all work together to agree on what
behavior should be added. So when you open an issue, it's helpful to give some context around what you are trying to achieve,
why that is important, where the current functionality falls short, and any ideas you have on how it could be improved. 

These issues should get a `type:Enhancement` label. If the solution seems obvious enough and you think others will agree,
then anyone is welcome to implement the solution and propose it in a pull request.

However, if the issue is multifaceted or has many different good options, then there will likely need to be some discussion
first. In this case, a maintainer should add a `status:Needs Discussion` label. Then there will be some period of time where
anyone who has a stake in this issue or ideas on how to solve it should work together to come up with a coherent solution.

Once there seem to be some consensus around how to move forward, then someone can proceed to implementing the changes.
